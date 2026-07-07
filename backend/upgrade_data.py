"""
批量升级 dishes-data.json：
1. 添加 cuisine（英文 key）
2. 添加 tags（标签数组）
3. 添加 cover（封面路径）
4. 添加 protein/fat/carbs/servings（营养信息）
5. 食材从字符串数组改为 {name, amount} 对象数组
"""
import json
import os
import re

DATA_PATH = os.path.join(os.path.dirname(__file__), 'app', 'data', 'dishes-data.json')

with open(DATA_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# ========== 1. 菜系英文映射 ==========
cuisine_map = {
    '家常菜': 'home', '川菜': 'sichuan', '粤菜': 'cantonese', '湘菜': 'hunan',
    '鲁菜': 'shandong', '苏菜': 'jiangsu', '浙菜': 'zhejiang', '闽菜': 'fujian',
    '东北菜': 'northeast', '西北菜': 'northwest', '海鲜': 'seafood',
    '汤煲': 'soup', '主食': 'staple', '甜品': 'dessert',
    '西餐': 'western', '日料': 'japanese',
}

# ========== 2. 食材用量映射 ==========
amount_map = {
    # 蔬菜
    '番茄': '2个', '西红柿': '2个', '西兰花': '1颗', '洋葱': '半个', '土豆': '2个',
    '青椒': '2个', '红椒': '1个', '茄子': '2根', '黄瓜': '1根', '胡萝卜': '1根',
    '白菜': '半颗', '芹菜': '2根', '豆芽': '200g', '蘑菇': '200g', '香菇': '6朵',
    '木耳': '50g', '竹笋': '100g', '莲藕': '1节', '玉米': '1根', '南瓜': '200g',
    '花菜': '1颗', '豆角': '200g', '四季豆': '200g', '蒜薹': '200g', '韭菜': '100g',
    '生菜': '1颗', '菠菜': '200g', '莴笋': '1根', '冬瓜': '300g', '丝瓜': '1根',
    '苦瓜': '1根', '荷兰豆': '150g', '山药': '200g', '红薯': '1个', '白萝卜': '1根',
    '黄花菜': '50g', '板栗': '100g', '酸菜': '200g', '荸荠': '6个', '梅干菜': '50g',
    '酸萝卜': '100g', '菠萝': '半个',
    # 肉类
    '猪肉': '200g', '五花肉': '300g', '排骨': '500g', '牛肉': '250g', '牛肉末': '150g',
    '鸡肉': '200g', '鸡翅': '8个', '鸡腿': '2个', '鸡胸肉': '200g', '三黄鸡': '1只',
    '鸭肉': '半只', '羊肉': '300g', '猪蹄': '1个', '猪肝': '200g', '牛腩': '500g',
    '牛排': '1块', '培根': '50g', '火腿': '50g', '腊肉': '100g', '香肠': '2根',
    '鸡杂': '200g', '鸭血': '200g', '猪大肠': '300g',
    # 海鲜
    '虾': '300g', '鱼': '1条', '鲈鱼': '1条', '三文鱼': '200g', '螃蟹': '2只',
    '鱿鱼': '1只', '龙虾': '1只', '蛤蜊': '500g', '扇贝': '6个', '生蚝': '6个',
    '海带': '100g', '带鱼': '1条', '黄鱼': '1条', '紫菜': '10g', '虾皮': '20g',
    '鲍鱼': '4个', '海参': '2根',
    # 蛋豆
    '豆腐': '1块', '嫩豆腐': '1块', '蛋清': '2个', '花生米': '50g', '腐竹': '50g',
    '豌豆': '50g', '牛奶': '200ml', '奶油': '50ml', '芝士': '30g', '黄油': '20g',
    '酸奶': '100g', '豆皮': '100g', '豆干': '100g', '香干': '100g',
    # 主食
    '米饭': '1碗', '隔夜米饭': '1碗', '面条': '200g', '粉丝': '1把', '年糕': '200g',
    '饺子皮': '20张', '糯米': '100g', '面粉': '200g', '面包糠': '50g', '意面': '200g',
    '澄粉': '100g', '粘米粉': '100g', '糯米粉': '100g', '寿司米': '200g', '馒头': '2个',
    # 调味
    '盐': '适量', '糖': '1勺', '蒜': '3瓣', '姜': '3片', '葱': '1根', '葱花': '适量',
    '葱丝': '适量', '姜丝': '适量', '生抽': '2勺', '老抽': '1勺', '料酒': '1勺',
    '淀粉': '1勺', '食用油': '适量', '花生油': '适量', '香油': '少许', '蚝油': '1勺',
    '醋': '2勺', '豆瓣酱': '2勺', '花椒': '1小把', '干辣椒': '5个', '八角': '2个',
    '桂皮': '1小块', '冰糖': '30g', '可乐': '1罐', '蜂蜜': '1勺', '芝麻': '少许',
    '白芝麻': '少许', '胡椒粉': '少许', '五香粉': '少许', '番茄酱': '2勺',
    '甜面酱': '2勺', '黄豆酱': '1勺', '芝麻酱': '1勺', '咖喱粉': '2勺',
    '黑胡椒': '少许', '白胡椒': '少许', '椒盐': '少许', '孜然': '少许',
    '十三香': '少许', '蒸鱼豉油': '2勺', '陈皮': '1小块', '香叶': '2片',
    '剁椒': '2勺', '泡椒': '5个', '芥末': '少许', '炼乳': '20g', '辣椒油': '1勺',
    '茶叶': '10g', '味噌': '2勺', '海苔': '2片', '寿司醋': '1勺',
    '葱白': '1段', '红椒丝': '少许', '蒜片': '3瓣',
}

# ========== 3. 标签生成规则 ==========
def generate_tags(dish):
    tags = []
    cat_tag = dish.get('categoryTag', '')
    if cat_tag:
        tag_map = {'快手菜': '快手', '经典菜': '经典', '健康菜': '健康',
                   '宴客菜': '宴客', '下饭菜': '下饭', '减脂菜': '减脂'}
        tags.append(tag_map.get(cat_tag, cat_tag))

    # 新手友好
    if dish['difficulty'] == '简单' and dish['time'] <= 15:
        tags.append('新手友好')

    # 低卡
    if dish['calories'] <= 150:
        tags.append('低卡')

    # 高蛋白
    meat_ings = ['牛肉', '鸡肉', '鸡胸肉', '鸡翅', '鸡腿', '鱼肉', '虾', '三文鱼',
                 '排骨', '五花肉', '猪肉', '牛排', '鸡蛋']
    dish_ings = dish['ingredients']
    if isinstance(dish_ings[0], dict):
        dish_ings = [i['name'] for i in dish_ings]
    if any(m in dish_ings for m in meat_ings):
        tags.append('高蛋白')

    # 一人食
    if dish['time'] <= 15 and dish['calories'] <= 350:
        tags.append('一人食')

    # 下饭（辣菜）
    if dish.get('spiceLevel') in ('中辣', '重辣') and '下饭' not in tags:
        tags.append('下饭')

    # 夜宵
    if dish.get('category') in ('主食', '汤煲') and dish['time'] <= 15:
        tags.append('夜宵')

    # 儿童友好
    if dish.get('spiceLevel') == '不辣' and dish['calories'] <= 300 and dish['difficulty'] == '简单':
        tags.append('儿童友好')

    return tags

# ========== 4. 营养信息估算 ==========
def estimate_nutrition(dish):
    """根据食材估算蛋白质/脂肪/碳水"""
    dish_ings = dish['ingredients']
    if isinstance(dish_ings[0], dict):
        dish_ings = [i['name'] for i in dish_ings]

    protein = fat = carbs = 0
    for ing in dish_ings:
        # 蛋白质 (g)
        if ing in ['牛肉', '牛腩', '牛排', '鸡肉', '鸡胸肉', '鸡腿', '鸡翅', '猪肉', '五花肉', '排骨', '羊肉', '鱼肉', '鲈鱼', '三文鱼', '虾', '螃蟹', '鱿鱼', '龙虾', '带鱼', '黄鱼', '蛤蜊', '扇贝', '生蚝', '鲍鱼', '海参']:
            protein += 20
        elif ing in ['鸡蛋', '蛋清', '豆腐', '嫩豆腐', '腐竹', '豆皮', '豆干', '香干', '芝士', '酸奶']:
            protein += 8
        elif ing in ['牛奶']:
            protein += 3

        # 脂肪 (g)
        if ing in ['五花肉', '猪蹄', '猪大肠', '腊肉', '培根', '黄油', '奶油', '芝士']:
            fat += 15
        elif ing in ['猪肉', '牛肉', '牛腩', '羊肉', '排骨', '鸭肉', '三文鱼']:
            fat += 8
        elif ing in ['食用油', '花生油', '香油', '辣椒油']:
            fat += 10
        elif ing in ['鸡蛋', '花生米']:
            fat += 5

        # 碳水 (g)
        if ing in ['米饭', '隔夜米饭', '面条', '意面', '粉丝', '年糕', '糯米', '面粉', '糯米粉', '粘米粉', '澄粉', '馒头', '饺子皮', '寿司米']:
            carbs += 40
        elif ing in ['土豆', '红薯', '山药', '玉米', '南瓜']:
            carbs += 15
        elif ing in ['糖', '冰糖', '蜂蜜', '炼乳', '可乐']:
            carbs += 10
        elif ing in ['番茄', '洋葱', '胡萝卜', '莲藕', '菠萝', '荸荠']:
            carbs += 5

    # 份数
    servings = 2 if dish['calories'] > 200 else 1
    return {
        'protein': protein,
        'fat': fat,
        'carbs': carbs,
        'servings': servings
    }

# ========== 5. 封面路径生成 ==========
def generate_cover(dish):
    """生成封面路径"""
    name = dish['name']
    # 使用菜系 + 菜名拼音首字母作为文件名
    return f"/images/dishes/{name}.svg"

# ========== 执行转换 ==========
dishes = data['dishes']
for dish in dishes:
    # 1. cuisine
    dish['cuisine'] = cuisine_map.get(dish['category'], 'other')

    # 2. tags
    dish['tags'] = generate_tags(dish)

    # 3. cover
    dish['cover'] = generate_cover(dish)

    # 4. 营养信息
    nutrition = estimate_nutrition(dish)
    dish['protein'] = nutrition['protein']
    dish['fat'] = nutrition['fat']
    dish['carbs'] = nutrition['carbs']
    dish['servings'] = nutrition['servings']

    # 5. 食材改为对象数组
    old_ings = dish['ingredients']
    new_ings = []
    for ing in old_ings:
        amount = amount_map.get(ing, '适量')
        new_ings.append({'name': ing, 'amount': amount})
    dish['ingredients'] = new_ings

# 写回
with open(DATA_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ 已更新 {len(dishes)} 道菜品")
print(f"   - 添加 cuisine 字段")
print(f"   - 添加 tags 字段")
print(f"   - 添加 cover 字段")
print(f"   - 添加 protein/fat/carbs/servings 字段")
print(f"   - 食材改为 {{name, amount}} 对象数组")

# 验证
sample = dishes[0]
print(f"\n示例: {sample['name']}")
print(f"  cuisine: {sample['cuisine']}")
print(f"  tags: {sample['tags']}")
print(f"  cover: {sample['cover']}")
print(f"  protein: {sample['protein']}g, fat: {sample['fat']}g, carbs: {sample['carbs']}g, servings: {sample['servings']}")
print(f"  ingredients: {sample['ingredients']}")
