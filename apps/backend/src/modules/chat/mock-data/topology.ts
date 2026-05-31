export const topology = {
  systemId: '91277829861244e39a051f757c015e18',
  data: JSON.stringify({
    nodes: [
      {
        id: 'ff320c0197d8459987345df83533218c',
        label: '查询业务',
        comboId: 'business',
        status: null,
      },
      {
        id: '1742836e383b4dca9e436043e755f9c9',
        label: '交易业务',
        comboId: 'business',
        status: null,
      },
      {
        id: '91277829861244e39a051f757c015e18',
        label: '柜台交易系统',
        comboId: 'application_system',
        status: null,
      },
      {
        id: '91f4679dcf0f4b4b9319331fc76a0718',
        label: '设备主机测试',
        comboId: 'items_hosts',
        status: null,
      },
      {
        id: '01324a9e1a9545c2814b4698a10c5cb3',
        label: 'mysql',
        comboId: 'items_middleware',
        status: null,
      },
      {
        id: '81494d05934246778cebdba8ca2a1053',
        label: 'Cloud',
        comboId: 'microservices',
        status: null,
      },
      {
        id: 'cb0490ad6e514806b1c2efc988f56882',
        label: '取款业务',
        comboId: 'business',
        status: null,
      },
      {
        id: '3496f4d5e12a48039d20e5adb3c8de07',
        label: '武汉数据中心',
        comboId: 'data_center',
        status: null,
      },
      {
        id: '402edc4472154b4794e2848f671acc70',
        label: '存款业务',
        comboId: 'business',
        status: null,
      },
    ],
    edges: [
      {
        source: '1742836e383b4dca9e436043e755f9c9',
        target: '91277829861244e39a051f757c015e18',
      },
      {
        source: 'ff320c0197d8459987345df83533218c',
        target: '91277829861244e39a051f757c015e18',
      },
      {
        source: '81494d05934246778cebdba8ca2a1053',
        target: '01324a9e1a9545c2814b4698a10c5cb3',
      },
      {
        source: '91f4679dcf0f4b4b9319331fc76a0718',
        target: '3496f4d5e12a48039d20e5adb3c8de07',
      },
      {
        source: '402edc4472154b4794e2848f671acc70',
        target: '91277829861244e39a051f757c015e18',
      },
      {
        source: '91277829861244e39a051f757c015e18',
        target: '81494d05934246778cebdba8ca2a1053',
      },
      {
        source: '01324a9e1a9545c2814b4698a10c5cb3',
        target: '91f4679dcf0f4b4b9319331fc76a0718',
      },
      {
        source: 'cb0490ad6e514806b1c2efc988f56882',
        target: '91277829861244e39a051f757c015e18',
      },
    ],
    combos: [
      {
        id: 'business',
        label: '业务层',
        sort: 10,
      },
      {
        id: 'application_system',
        label: '应用系统层',
        sort: 20,
      },
      {
        id: 'microservices',
        label: '微服务层',
        sort: 30,
      },
      {
        id: 'items_middleware',
        label: '中间件层',
        sort: 40,
      },
      {
        id: 'items_hosts',
        label: '主机层',
        sort: 50,
      },
      {
        id: 'data_center',
        label: '数据中心层',
        sort: 60,
      },
    ],
    datacenters: [],
  }),
  graphType: 'knowledgeTopo',
};