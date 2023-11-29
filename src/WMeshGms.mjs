import fs from 'fs'
import get from 'lodash/get'
import map from 'lodash/map'
import each from 'lodash/each'
import drop from 'lodash/drop'
import split from 'lodash/split'
import values from 'lodash/values'
import min from 'lodash/min'
import max from 'lodash/max'
import sep from 'wsemi/src/sep.mjs'
import cint from 'wsemi/src/cint.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'


function readXyz(fp) {
    // bottomleft_x, bottomleft_y, bottomleft_z, size_x, size_y, size_z
    // 311500.0, 2722500.0, -20.0, 100, 100, 1
    let c = fs.readFileSync(fp, 'utf8')
    let ss = sep(c, '\n')
    ss = drop(ss, 1)
    let lines = map(ss, (s) => {
        return split(s, ',')
    })
    let line = get(lines, 0, [])
    let kp = {
        blx: cdbl(get(line, 0, 0)),
        bly: cdbl(get(line, 1, 0)),
        z: cdbl(get(line, 2, 0)),
        sx: cdbl(get(line, 3, 0)),
        sy: cdbl(get(line, 4, 0)),
        sz: cdbl(get(line, 5, 0)),
    }
    return kp
}


function readMat(fp) {
    // no, "id", "k", "i", "j", "f"
    // 1, 1, 1, 1, 1, 1
    // 2, 2, 1, 1, 2, 1
    // 3, 3, 1, 1, 3, 1
    let c = fs.readFileSync(fp, 'utf8')
    let ss = sep(c, '\n')
    ss = drop(ss, 1)
    let lines = map(ss, (s) => {
        return split(s, ',')
    })
    let kp = {}
    each(lines, (v) => {
        let id = cint(get(v, 1, 0))
        let k = cint(get(v, 2, 0))
        let i = cint(get(v, 3, 0))
        let j = cint(get(v, 4, 0))
        let mat = cint(get(v, 5, 0))
        kp[id] = { id, i, j, k, mat }
    })
    return kp
}


function readTopBot(fp, key) {
    // no, "id", "k", "i", "j", "f", "Active"
    // 1, 1, 1, 1, 1, 29.0, 0
    // 2, 2, 1, 1, 2, 29.0, 0
    // 3, 3, 1, 1, 3, 29.0, 0
    let c = fs.readFileSync(fp, 'utf8')
    let ss = sep(c, '\n')
    ss = drop(ss, 1)
    let lines = map(ss, (s) => {
        return split(s, ',')
    })
    let kp = {}
    each(lines, (v) => {
        let id = cint(get(v, 1, 0))
        let k = cint(get(v, 2, 0))
        let i = cint(get(v, 3, 0))
        let j = cint(get(v, 4, 0))
        let value = cdbl(get(v, 5, 0))
        let active = cint(get(v, 6, 0))
        kp[id] = {
            id,
            i,
            j,
            k,
            [key]: value,
            active,
        }
    })
    return kp
}


/**
 * 讀取GMS的ASCII檔
 *
 * @param {String} fp 輸入檔案位置字串
 * @return {Promise} 回傳Promise，resolve回傳ltdt(各數據列為物件陣列)，reject回傳錯誤訊息
 * @example
 *
 * let fpXyz = './_mesh/YiLan_xyz.txt'
 * let fpTop = './_mesh/YiLan_top.txt'
 * let fpBot = './_mesh/YiLan_bot.txt'
 * let fpMat = './_mesh/YiLan_mat.txt'
 * wmg.readGms(fpXyz, fpTop, fpBot, fpMat)
 *     .then((res) => {
 *         console.log(res)
 *         console.log('finish.')
 *     })
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
async function readGms(fpXyz, fpTop, fpBot, fpMat) {

    // console.log('reading...xyz')
    let vxyz = readXyz(fpXyz)
    // console.log('vxyz', vxyz)

    // console.log('reading...top')
    let vtop = readTopBot(fpTop, 'top')
    // console.log('vtop[1]', vtop[1])

    // console.log('reading...bot')
    let vbot = readTopBot(fpBot, 'bot')
    // console.log('vbot[1]', vbot[1])

    // console.log('reading...mat')
    let vmat = readMat(fpMat)
    // console.log('vmat[1]', vmat[1])

    //merge
    // console.log('merging...')
    let kpEle = {}
    each(vmat, (v, id) => {
        let top = get(vtop, `${id}.top`, 0)
        let bot = get(vbot, `${id}.bot`, 0)
        let active = get(vbot, `${id}.active`, 0)
        let key = `${v.i}-${v.j}-${v.k}`
        kpEle[key] = {
            id: v.id,
            i: v.i,
            j: v.j,
            k: v.k,
            top,
            bot,
            mat: v.mat,
            active,
        }
    })
    // console.log(`kpEle['1-1-1']`, kpEle['1-1-1'])

    //_eles
    let _eles = values(kpEle)

    //min, max
    let _is = map(_eles, 'i')
    let iMin = min(_is)
    let iMax = max(_is)
    let _js = map(_eles, 'j')
    let jMin = min(_js)
    let jMax = max(_js)
    let _ks = map(_eles, 'k')
    let kMin = min(_ks)
    let kMax = max(_ks)

    //nodes, kpNode
    let nodes = []
    let kpNode = {}
    if (true) {

        let indn = 0
        for (let _k = kMax; _k >= kMin; _k--) {
            for (let i = iMin; i <= iMax; i++) {
                for (let j = jMin; j <= jMax; j++) {

                    let k = kMax - _k + 1
                    let keyOri = `${i}-${j}-${_k}`
                    let keyNew = `${i}-${j}-${k}`

                    let ele = get(kpEle, keyOri, {})

                    //將元素視為左下節點(tecplot的節點才可給參數), 故座標須平移半格, i,j最末端不處理, 因此x,y向長寬會少sx與sy
                    let x = vxyz.blx + (i + 0.5) * vxyz.sx
                    let y = vxyz.bly + (j + 0.5) * vxyz.sy
                    let z = get(ele, 'bot', 0)
                    let mat = get(ele, 'mat', 0)
                    let active = get(ele, 'active', 0)

                    indn++
                    let node = {
                        indn,
                        key: keyNew,
                        x,
                        y,
                        z,
                        mat, //tecplot的節點才可給參數
                        active,
                    }
                    nodes.push(node)
                    kpNode[keyNew] = node

                    //若為最頂部, 則取top出來添加節點
                    if (_k === kMin) {

                        keyNew = `${i}-${j}-${k + 1}`

                        z = get(ele, 'top', 0)

                        indn++
                        let node = {
                            indn,
                            key: keyNew,
                            x,
                            y,
                            z,
                            mat, //tecplot的節點才可給參數
                            active,
                        }
                        nodes.push(node)
                        kpNode[keyNew] = node

                    }

                }
            }
        }

    }
    // console.log('nodes[0]', nodes[0])
    // console.log(`kpNode['1-1-1']`, kpNode['1-1-1'])

    //eles
    let eles = []
    if (true) {

        //將元素視為左下節點, 故座標須平移半格, i,j,k最末端不處理, 因此x,y向元素各-1
        let inde = 0
        for (let _k = kMax; _k >= kMin; _k--) {
            for (let i = iMin; i <= iMax - 1; i++) {
                for (let j = jMin; j <= jMax - 1; j++) {

                    let k = kMax - _k + 1
                    let key000 = `${i}-${j}-${k}`
                    let key100 = `${i + 1}-${j}-${k}`
                    let key110 = `${i + 1}-${j + 1}-${k}`
                    let key010 = `${i}-${j + 1}-${k}`
                    let key001 = `${i}-${j}-${k + 1}`
                    let key101 = `${i + 1}-${j}-${k + 1}`
                    let key111 = `${i + 1}-${j + 1}-${k + 1}`
                    let key011 = `${i}-${j + 1}-${k + 1}`

                    let active000 = get(kpNode, `${key000}.active`, 0)
                    let active100 = get(kpNode, `${key100}.active`, 0)
                    let active110 = get(kpNode, `${key110}.active`, 0)
                    let active010 = get(kpNode, `${key010}.active`, 0)
                    let active001 = get(kpNode, `${key001}.active`, 0)
                    let active101 = get(kpNode, `${key101}.active`, 0)
                    let active111 = get(kpNode, `${key111}.active`, 0)
                    let active011 = get(kpNode, `${key011}.active`, 0)
                    let active = active000 + active100 + active110 + active010 + active001 + active101 + active111 + active011
                    if (active !== 8) {
                        continue
                    }

                    inde++
                    let ele = {
                        inde,
                        // kds: {
                        //     key000,
                        //     key100,
                        //     key110,
                        //     key010,
                        //     key001,
                        //     key101,
                        //     key111,
                        //     key011,
                        // },
                        nodes: [
                            get(kpNode, `${key000}.indn`, 0),
                            get(kpNode, `${key100}.indn`, 0),
                            get(kpNode, `${key110}.indn`, 0),
                            get(kpNode, `${key010}.indn`, 0),
                            get(kpNode, `${key001}.indn`, 0),
                            get(kpNode, `${key101}.indn`, 0),
                            get(kpNode, `${key111}.indn`, 0),
                            get(kpNode, `${key011}.indn`, 0),
                        ],
                        mat: get(kpNode, `${key000}.mat`, 0),
                    }
                    eles.push(ele)

                }
            }
        }

    }
    // console.log('eles[0]', eles[0])

    return {
        nodes,
        eles,
    }
}


/**
 * 輸出數據至GMS檔案
 *
 * @param {String} fp 輸入檔案位置字串
 * @param {Array} data 輸入數據陣列，為mat或ltdt格式
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.mode='ltdt'] 輸入數據格式字串，可選ltdt或mat，預設ltdt
 * @param {Array} [opt.keys=[]] 輸入指定欲輸出鍵值陣列，預設[]
 * @param {Object} [opt.kphead={}] 輸入指定鍵值轉換物件，預設{}
 * @return {Promise} 回傳Promise，resolve回傳成功訊息，reject回傳錯誤訊息
 * @example
 *

 *
 */
async function writeGms(fp, nodes, eles, opt = {}) {

    console.log('尚待開發')

    return null
}

/**
 * 讀寫GMS的ASCII檔檔
 *
 * @return {Object} 回傳物件，其內有readGms與writeGms函式
 * @example
 *

 *
 */
let WMeshGms = {
    readGms,
    writeGms,
}


export default WMeshGms
