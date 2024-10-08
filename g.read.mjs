import fs from 'fs'
import wmg from './src/WMeshGms.mjs'


let fpXyz = './_mesh/YiLan_xyz.txt'
let fpTop = './_mesh/YiLan_top.txt'
let fpBot = './_mesh/YiLan_bot.txt'
let fpMat = './_mesh/YiLan_mat.txt'
let fpOut = './_mesh/mesh.json'

console.log('reading...')
wmg.readGms(fpXyz, fpTop, fpBot, fpMat)
    .then((r) => {

        console.log('writing...')
        fs.writeFileSync(fpOut, JSON.stringify(r), 'utf8')

        console.log('finish.')
    })
    .catch((err) => {
        console.log(err)
    })

//node --no-warnings --max-old-space-size=120000 g.read.mjs

