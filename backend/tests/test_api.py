import json

import pytest
from fastapi.testclient import TestClient

from app.database import get_conn, init_db
from app.routers import chat as chat_router
from app.services.auth_service import hash_password
from main import app


@pytest.fixture(scope="module")
def client():
    init_db()
    with get_conn() as conn:
        category_id = conn.execute(
            "INSERT INTO categories (name, sort_order) VALUES ('测试菜系', 1)"
        ).lastrowid
        type_id = conn.execute(
            "INSERT INTO ingredient_types (key, name) VALUES ('test', '测试食材')"
        ).lastrowid
        tomato_id = conn.execute(
            "INSERT INTO ingredients (name, type_id, icon) VALUES ('番茄', ?, '/images/icons/tomato.svg')",
            (type_id,),
        ).lastrowid
        peanut_id = conn.execute(
            "INSERT INTO ingredients (name, type_id, icon) VALUES ('花生', ?, '/images/icons/peanut.svg')",
            (type_id,),
        ).lastrowid

        blocked_dish = conn.execute(
            "INSERT INTO dishes (name, category_id, cuisine, description, time) "
            "VALUES ('花生番茄测试菜', ?, 'test', '含过敏原', 10)",
            (category_id,),
        ).lastrowid
        safe_dish = conn.execute(
            "INSERT INTO dishes (name, category_id, cuisine, description, time) "
            "VALUES ('安全番茄测试菜', ?, 'test', '不含花生', 12)",
            (category_id,),
        ).lastrowid
        conn.executemany(
            "INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?, ?, ?)",
            [
                (blocked_dish, tomato_id, '1个'),
                (blocked_dish, peanut_id, '20g'),
                (safe_dish, tomato_id, '2个'),
            ],
        )
        conn.execute(
            "INSERT INTO dish_steps (dish_id, step_index, title, description, time) "
            "VALUES (?, 1, '准备', '洗净番茄', 1)",
            (safe_dish,),
        )
        conn.execute(
            "INSERT INTO users (username, password_hash, nickname, is_admin) VALUES (?, ?, ?, 1)",
            ('test-admin', hash_password('Admin-Test-2026!'), '测试管理员'),
        )

    with TestClient(app) as test_client:
        yield test_client


def login(client, username, password):
    response = client.post('/api/auth/login', json={'username': username, 'password': password})
    assert response.status_code == 200, response.text
    return response.json()


def auth(token):
    return {'Authorization': 'Bearer ' + token}


def test_health_and_read_endpoints(client):
    assert client.get('/api/health').json()['status'] == 'ok'
    assert client.get('/api/dishes/categories').status_code == 200
    assert client.get('/api/dishes/ingredients').status_code == 200
    assert client.get('/api/videos/all/list').status_code == 200
    assert client.get('/api/chat/quick-questions').status_code == 200
    assert client.get('/api/health/live').json()['status'] == 'ok'
    assert client.get('/api/health/ready').json()['database'] == 'ready'
    levels = client.get('/api/dishes/spice-levels').json()['levels']
    assert [item['key'] for item in levels] == ['all', '不辣', '微辣', '中辣', '特辣']


def test_structured_errors_include_request_id(client):
    response = client.get('/api/auth/me', headers={'X-Request-ID': 'qa-request-id'})
    assert response.status_code == 401
    assert response.headers['X-Request-ID'] == 'qa-request-id'
    assert response.json()['error']['code'] == 'AUTH_REQUIRED'
    assert response.json()['error']['request_id'] == 'qa-request-id'


def test_registration_login_and_profile(client):
    response = client.post(
        '/api/auth/register',
        json={'username': 'regular-user', 'password': 'secure-pass', 'nickname': '普通用户'},
    )
    assert response.status_code == 200
    assert response.json()['user']['is_admin'] is False
    assert client.post(
        '/api/auth/register',
        json={'username': 'regular-user', 'password': 'secure-pass', 'nickname': '重复用户'},
    ).status_code == 400
    assert client.post(
        '/api/auth/login', json={'username': 'regular-user', 'password': 'wrong-pass'}
    ).status_code == 401

    session = login(client, 'regular-user', 'secure-pass')
    response = client.put(
        '/api/auth/profile',
        headers=auth(session['token']),
        json={'nickname': '厨房新人', 'signature': '今天认真吃饭', 'avatar': '/images/brand-logo.png'},
    )
    assert response.status_code == 200
    assert response.json()['user']['nickname'] == '厨房新人'
    assert client.get('/api/auth/me', headers=auth(session['token'])).status_code == 200


def test_preferences_avatar_validation_and_shopping_sync(client):
    token = login(client, 'regular-user', 'secure-pass')['token']
    preferences = {
        'dietary_tags': ['少油', '高蛋白'],
        'disliked_ingredients': ['香菜'],
        'allergens': ['花生'],
        'household_size': 3,
        'default_spice': 'light',
    }
    response = client.put('/api/auth/preferences', headers=auth(token), json=preferences)
    assert response.status_code == 200
    assert client.get('/api/auth/preferences', headers=auth(token)).json()['preferences'] == preferences
    assert client.put(
        '/api/auth/preferences', headers=auth(token), json={**preferences, 'household_size': 21}
    ).status_code == 400

    invalid_avatar = client.post(
        '/api/auth/avatar',
        headers=auth(token),
        files={'file': ('avatar.txt', b'not-an-image', 'text/plain')},
    )
    assert invalid_avatar.status_code == 400
    valid_avatar = client.post(
        '/api/auth/avatar', headers=auth(token),
        files={'file': ('avatar.png', b'\x89PNG\r\n\x1a\nmock', 'image/png')},
    )
    assert valid_avatar.status_code == 200
    assert valid_avatar.json()['avatar'].startswith('/uploads/avatars/')

    items = [{
        'id': 'manual::1', 'name': '鸡蛋', 'amount': '2个',
        'dish_id': 'manual', 'dish_name': '手动添加', 'checked': False,
    }]
    assert client.put('/api/user/shopping-list', headers=auth(token), json={'items': items}).status_code == 200
    shopping = client.get('/api/user/shopping-list', headers=auth(token)).json()['items']
    assert shopping[0]['name'] == '鸡蛋'
    assert shopping[0]['checked'] is False


def test_recommendation_excludes_allergens(client):
    response = client.post(
        '/api/dishes/random',
        json={
            'selected_ingredients': ['番茄'],
            'category': '测试菜系',
            'spice_level': None,
            'excluded_ingredients': ['花生'],
        },
    )
    assert response.status_code == 200
    names = [dish['name'] for dish in response.json()['matched_dishes']]
    assert '安全番茄测试菜' in names
    assert '花生番茄测试菜' not in names


def test_recommendation_accepts_cuisine_keys_spice_aliases_and_relaxes_filters(client):
    keyed = client.post(
        '/api/dishes/random',
        json={
            'selected_ingredients': ['番茄'],
            'category': 'test',
            'spice_level': 'mild',
            'excluded_ingredients': [],
        },
    )
    assert keyed.status_code == 200
    assert keyed.json()['matched_dish'] is not None
    assert keyed.json()['matched_dish']['cuisine'] == 'test'

    relaxed = client.post(
        '/api/dishes/random',
        json={
            'selected_ingredients': ['番茄'],
            'category': 'nonexistent-cuisine',
            'spice_level': 'hot',
            'excluded_ingredients': [],
        },
    )
    assert relaxed.status_code == 200
    assert relaxed.json()['matched_dish'] is not None
    assert 'category' in relaxed.json()['match_meta']['relaxed_filters']


def test_favorites_and_history(client):
    token = login(client, 'regular-user', 'secure-pass')['token']
    with get_conn() as conn:
        dish_id = conn.execute("SELECT id FROM dishes WHERE name = '安全番茄测试菜'").fetchone()['id']
    assert client.post('/api/user/favorites', headers=auth(token), json={'dish_id': dish_id}).status_code == 200
    assert client.get(f'/api/user/favorites/{dish_id}/check', headers=auth(token)).json()['favorited'] is True
    assert len(client.get('/api/user/favorites', headers=auth(token)).json()['favorites']) == 1
    assert client.post('/api/user/history', headers=auth(token), json={'dish_id': dish_id}).status_code == 200
    assert len(client.get('/api/user/history', headers=auth(token)).json()['history']) == 1
    assert client.delete('/api/user/history', headers=auth(token)).status_code == 200
    assert client.delete(f'/api/user/favorites/{dish_id}', headers=auth(token)).status_code == 200


def test_idempotent_user_data_sync(client):
    session = client.post('/api/auth/register', json={
        'username': 'sync-user', 'password': 'secure-pass', 'nickname': '同步用户',
    }).json()
    with get_conn() as conn:
        dish_id = conn.execute("SELECT id FROM dishes ORDER BY id LIMIT 1").fetchone()['id']
    payload = {
        'favorite_ids': [dish_id, dish_id],
        'history_ids': [dish_id, dish_id],
        'shopping_items': [{
            'id': 'sync::item', 'name': '番茄', 'amount': '2个', 'dish_id': str(dish_id),
            'dish_name': '测试菜', 'checked': False, 'updated_at': 1700000000000,
        }],
    }
    first = client.post('/api/user/sync', headers=auth(session['token']), json=payload)
    second = client.post('/api/user/sync', headers=auth(session['token']), json=payload)
    assert first.status_code == second.status_code == 200
    assert len(second.json()['favorites']) == 1
    assert len(second.json()['history']) == 1
    assert len(second.json()['shopping_items']) == 1


def test_permissions_user_management_and_audit(client):
    regular = login(client, 'regular-user', 'secure-pass')
    assert client.get('/api/admin/dashboard', headers=auth(regular['token'])).status_code == 403

    admin = login(client, 'test-admin', 'Admin-Test-2026!')
    admin_headers = auth(admin['token'])
    assert client.put(
        f"/api/admin/users/{admin['user']['id']}/password", headers=admin_headers,
    ).status_code == 400
    assert client.put(
        '/api/auth/password', headers=admin_headers,
        json={'old_password': 'Admin-Test-2026!', 'new_password': 'short123'},
    ).status_code == 400
    dashboard = client.get('/api/admin/dashboard', headers=admin_headers)
    assert dashboard.status_code == 200
    assert dashboard.json()['users'] >= 2

    users = client.get('/api/admin/users', headers=admin_headers).json()['users']
    regular_user = next(user for user in users if user['username'] == 'regular-user')
    reset = client.put(f"/api/admin/users/{regular_user['id']}/password", headers=admin_headers)
    temporary_password = reset.json()['temporary_password']
    assert temporary_password != '123456'
    assert login(client, 'regular-user', temporary_password)['user']['is_admin'] is False
    assert client.put(
        f"/api/admin/users/{regular_user['id']}/admin",
        headers=admin_headers,
        params={'is_admin': True},
    ).status_code == 200
    assert client.put(
        f"/api/admin/users/{regular_user['id']}/admin",
        headers=admin_headers,
        params={'is_admin': False},
    ).status_code == 200
    logs = client.get('/api/admin/audit-logs', headers=admin_headers).json()['logs']
    assert any(log['action'] == 'reset_user_password' for log in logs)


def test_admin_dish_ingredient_steps_and_video_crud(client):
    admin_token = login(client, 'test-admin', 'Admin-Test-2026!')['token']
    headers = auth(admin_token)
    upload = client.post(
        '/api/videos/admin/upload', headers=headers,
        files={'file': ('clip.mp4', b'0000ftypisom', 'video/mp4')},
    )
    assert upload.status_code == 200
    assert upload.json()['url'].startswith('/uploads/videos/')
    image_upload = client.post(
        '/api/admin/dish-images', headers=headers,
        files={'file': ('cover.webp', b'RIFFfakewebp', 'image/webp')},
    )
    assert image_upload.status_code == 200
    assert image_upload.json()['url'].startswith('/uploads/dishes/')
    with get_conn() as conn:
        category_id = conn.execute("SELECT id FROM categories WHERE name = '测试菜系'").fetchone()['id']

    created = client.post('/api/admin/dishes', headers=headers, json={
        'name': '后台新建测试菜', 'category_id': category_id, 'cuisine': 'test',
        'description': '管理台创建', 'difficulty': '简单', 'time': 18, 'calories': 230,
        'cover': image_upload.json()['url'],
    })
    assert created.status_code == 200, created.text
    dish_id = created.json()['dish']['id']
    updated = client.put(
        f'/api/admin/dishes/{dish_id}', headers=headers,
        json={'name': '后台编辑测试菜', 'time': 20},
    )
    assert updated.json()['dish']['name'] == '后台编辑测试菜'
    steps = client.put(
        f'/api/admin/dishes/{dish_id}/steps', headers=headers,
        json=[{'title': '第一步', 'description': '处理食材', 'time': 2}],
    )
    assert steps.status_code == 200

    ingredient = client.post('/api/admin/ingredients', headers=headers, json={
        'name': '测试新食材', 'emoji': '', 'type_id': None, 'icon': '/images/icons/leaf.svg',
    })
    assert ingredient.status_code == 200
    ingredient_id = ingredient.json()['ingredient']['id']
    assert client.put(
        f'/api/admin/ingredients/{ingredient_id}', headers=headers,
        json={'name': '测试编辑食材', 'emoji': '', 'type_id': None, 'icon': '/images/icons/leaf.svg'},
    ).status_code == 200
    linked = client.put(
        f'/api/admin/dishes/{dish_id}/ingredients', headers=headers,
        json=[{'ingredient_id': ingredient_id, 'amount': '200g', 'is_main': True}],
    )
    assert linked.status_code == 200
    detail = client.get(f'/api/admin/dishes/{dish_id}', headers=headers).json()['dish']
    assert detail['ingredients'][0]['id'] == ingredient_id
    assert detail['ingredients'][0]['is_main'] is True

    video = client.post('/api/videos/admin/add', headers=headers, json={
        'id': 'qa-video', 'dish_id': dish_id, 'dish_name': '后台编辑测试菜',
        'title': '测试教学视频', 'source': 'direct', 'video_url': 'https://example.com/test.mp4',
        'playable_in_miniprogram': True,
    })
    assert video.status_code == 200
    assert client.get('/api/videos/qa-video').status_code == 200
    video_list = client.get(
        '/api/videos/admin/list', headers=headers,
        params={'keyword': '测试教学', 'source': 'direct'},
    ).json()
    assert video_list['total'] == 1
    assert client.delete('/api/videos/admin/qa-video', headers=headers).status_code == 200
    impact = client.get(f'/api/admin/dishes/{dish_id}/delete-impact', headers=headers)
    assert impact.status_code == 200
    assert impact.json()['impact']['steps'] == 1
    assert impact.json()['impact']['ingredients'] == 1
    assert client.delete(f'/api/admin/dishes/{dish_id}', headers=headers).status_code == 200
    assert client.delete(f'/api/admin/ingredients/{ingredient_id}', headers=headers).status_code == 200
    audit = client.get(
        '/api/admin/audit-logs', headers=headers,
        params={'action': 'replace_dish_ingredients'},
    ).json()
    assert audit['total'] == 1


def test_chat_stream_uses_ndjson_events(client, monkeypatch):
    async def fake_stream(_message, _context):
        yield '第一段'
        yield '第二段'

    monkeypatch.setattr(chat_router, 'stream_ai_reply', fake_stream)
    response = client.post('/api/chat/stream', json={'message': '测试', 'context': []})
    assert response.status_code == 200
    assert response.headers['content-type'].startswith('application/x-ndjson')
    events = [json.loads(line) for line in response.text.splitlines()]
    assert [event['type'] for event in events] == ['start', 'delta', 'delta', 'done']
    assert events[-1]['text'] == '第一段第二段'


def test_invalid_tokens_and_self_protection(client):
    assert client.get('/api/auth/me').status_code == 401
    assert client.get('/api/auth/me', headers=auth('invalid-token')).status_code == 401
    admin = login(client, 'test-admin', 'Admin-Test-2026!')
    assert client.delete(
        f"/api/admin/users/{admin['user']['id']}", headers=auth(admin['token'])
    ).status_code == 400
