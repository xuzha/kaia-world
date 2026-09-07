export const stories = {
  ocean: {
    name: '航海',
    subtitle: '乘风，去看海',
    description: '房间变成大船，海风鼓起船帆。带上玩具，看海鸥飞过、岛屿慢慢远去。',
    worldName: 'Kaia 的海上小船',
    thought: '哇！我们的房间变成大船啦！',
    arrival: '甲板准备好啦！带着玩具和 Kaia 一起出发。',
    canvasLabel: 'Kaia 在海上航行的大船甲板上玩耍',
    day: '#e4ede7',
    night: '#d2dfda',
    zoom: 0.86,
  },
  space: {
    name: '太空',
    subtitle: '和星星做邻居',
    description:
      '走进空间站的观景舱，远处银河明暗交错。看看蓝色地球、轻薄的土星环，还有偶尔划过的流星。',
    worldName: 'Kaia 的小小空间站',
    thought: '看！地球像一颗蓝色的小球！',
    arrival: '欢迎来到小小空间站。和 Kaia 一起，在星球之间玩耍。',
    canvasLabel: 'Kaia 在有全景舷窗的空间站上玩耍，周围是银河星带、远处的繁星、蓝色地球和流星',
    day: '#0b132c',
    night: '#080f24',
    zoom: 0.77,
  },
  zoo: {
    name: '动物园',
    subtitle: '去见毛茸茸的朋友',
    description:
      '鳄鱼在大水池里慢慢游，猫狗在草地边散步。小兔蹦蹦跳跳，两只鹦鹉在横杆上转头、理羽。',
    worldName: 'Kaia 的动物朋友们',
    thought: '长颈鹿，你能看到云朵吗？',
    arrival: '动物朋友们来啦！在草地上玩，也看看身边的小伙伴。',
    canvasLabel:
      'Kaia 在动物园草地上玩耍，鳄鱼在大水池里游动，猫狗散步、小兔跳跃、鹦鹉理羽，长颈鹿、大象和狮子在周围张望',
    day: '#eaf0df',
    night: '#dbe3cc',
    zoom: 0.82,
  },
  polar: {
    name: '冰雪极地',
    subtitle: '跟着企鹅，去看极光',
    description:
      '在冰屋旁搭起小小营地。企鹅摇摇摆摆，海豹抬头张望，浮冰轻轻晃动，远处的极光慢慢流过夜空。',
    worldName: 'Kaia 的极光营地',
    thought: '企鹅走得摇摇摆摆，天空也在跳舞！',
    arrival: '到达极光营地！带着玩具，和企鹅、海豹一起看发光的天空。',
    canvasLabel: 'Kaia 在冰屋旁的浮冰营地玩耍，周围有企鹅、海豹、冰山和缓缓流动的极光',
    day: '#142e43',
    night: '#102437',
    zoom: 0.78,
  },
  forest: {
    name: '森林树屋',
    subtitle: '月光下，等萤火虫来',
    description:
      '夜晚住进大树上的木屋。暖灯照着玩具，吊桥连着邻居的大树；脚下溪流闪闪，松鼠抱着松果，萤火虫忽明忽暗。',
    worldName: 'Kaia 的月光树屋',
    thought: '嘘，萤火虫提着小灯笼来啦！',
    arrival: '欢迎来到月光树屋。溪流在脚下闪闪，松鼠在暖灯旁等你。',
    canvasLabel: 'Kaia 在夜晚森林的高架树屋木平台上玩耍，周围有吊桥、溪流、暖灯、萤火虫和松鼠',
    day: '#142f34',
    night: '#10272e',
    zoom: 0.74,
  },
} as const;

export type StoryId = keyof typeof stories;
export const storyIds = Object.keys(stories) as StoryId[];
