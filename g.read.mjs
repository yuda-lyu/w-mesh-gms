import fs from 'fs'
import _ from 'lodash'
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

//node --no-warnings --max-old-space-size=120000 --es-module-specifier-resolution=node g.read.mjs

