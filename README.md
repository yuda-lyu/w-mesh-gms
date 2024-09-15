# w-mesh-gms
A tool for GMS data.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-mesh-gms.svg?style=flat)](https://npmjs.org/package/w-mesh-gms) 
[![license](https://img.shields.io/npm/l/w-mesh-gms.svg?style=flat)](https://npmjs.org/package/w-mesh-gms) 
[![npm download](https://img.shields.io/npm/dt/w-mesh-gms.svg)](https://npmjs.org/package/w-mesh-gms) 
[![npm download](https://img.shields.io/npm/dm/w-mesh-gms.svg)](https://npmjs.org/package/w-mesh-gms) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-mesh-gms.svg)](https://www.jsdelivr.com/package/npm/w-mesh-gms)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-mesh-gms/global.html).

## Installation
### Using npm(ES6 module):
> **Note:** w-mesh-gms is mainly dependent on `lodash-es` and `wsemi`.
```alias
npm i w-mesh-gms
```

#### Example for read:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-mesh-gms/blob/master/g-read.mjs)]
```alias
import fs from 'fs'
import _ from 'lodash-es'
import wmg from './src/WMeshGms.mjs'


function ttc(name, nodes, eles) {

    //head
    let head = `TITLE = "Mesh" VARIABLES = "X", "Y", "Z", "M"`

    //c
    let c = head + '\n'

    //h
    let h = `ZONE T="${name}",N=${_.size(nodes)}, E=${_.size(eles)}, F=fepoint, ET=brick`
    c += h + '\n'

    _.each(nodes, (node) => {
        let vs = [
            node.x,
            node.y,
            node.z,
            node.mat,
            // v1,
            // v2,
            // v3,
        ]
        let t = _.join(vs, ' ')
        c += t + '\n'
    })

    _.each(eles, (ele) => {
        let vs = ele.nodes
        let t = _.join(vs, ' ')
        c += t + '\n'
    })

    return c
}

let fpXyz = './_mesh/YiLan_xyz.txt'
let fpTop = './_mesh/YiLan_top.txt'
let fpBot = './_mesh/YiLan_bot.txt'
let fpMat = './_mesh/YiLan_mat.txt'
let fpOut = './_mesh/cv2tecplot.dat'
let name = 'cv2tecplot'

console.log('reading...')
wmg.readGms(fpXyz, fpTop, fpBot, fpMat)
    .then((r) => {

        console.log('converting...')
        let tc = ttc(name, r.nodes, r.eles)

        console.log('writing...')
        fs.writeFileSync(fpOut, tc, 'utf8')

        console.log('finish.')
    })
    .catch((err) => {
        console.log(err)
    })
```

#### Example for write:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-mesh-gms/blob/master/g-write.mjs)]
```alias
尚待開發
```
