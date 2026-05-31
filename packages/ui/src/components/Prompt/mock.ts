export const introPrompt = {
  direction: 'horizontal',
  list: [
    {
      value: 'quickSort',
      label: '帮我写一封邮件',
      iconConfig: { name: 'el-icon-s-promotion', color: '#5e7ce0' },
      desc: '写一封条理清晰的邮件',
    },
    {
      value: 'helpMd',
      label: '你可以帮我做些什么？',
      iconConfig: { name: 'el-icon-star-on', color: 'rgb(255, 215, 0)' },
      desc: '了解当前大模型可以帮你做的事',
    },
    {
      value: 'bindProjectSpace',
      label: '学术搜索',
      iconConfig: { name: 'el-icon-s-help', color: '#3ac295' },
      desc: '中国的数字货币研发与应用',
    },
  ],
};

export const simplePrompt = [
  {
    value: 'quickSort',
    icon: 'icon-info-o',
    color: 'rgb(255, 215, 0)',
    label: '帮我写一个快速排序',
  },
  {
    value: 'helpMd',
    icon: 'icon-star',
    color: 'rgb(255, 215, 0)',
    label: '你可以帮我做些什么？',
  },
];