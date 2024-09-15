import fs from 'fs'
import get from 'lodash-es/get.js'
import map from 'lodash-es/map.js'
import each from 'lodash-es/each.js'
import size from 'lodash-es/size.js'
import join from 'lodash-es/join.js'
import drop from 'lodash-es/drop.js'
import split from 'lodash-es/split.js'
import values from 'lodash-es/values.js'
import min from 'lodash-es/min.js'
import max from 'lodash-es/max.js'
import sep from 'wsemi/src/sep.mjs'
import cint from 'wsemi/src/cint.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import cstr from 'wsemi/src/cstr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import ispm from 'wsemi/src/ispm.mjs'
import pmSeries from 'wsemi/src/pmSeries.mjs'


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


async function writeParseCols(cols, funProcLayers) {

    //rss, 解析cols轉出與生成指定欄位之數據
    let rss = []
    await pmSeries(cols, async(col, k) => {

        //id, 須為英文與數字組合, 逗號分隔符號不能用, 其他例如utf8字元不能使用
        let id = get(col, 'id', null)
        if (!isestr(id) && !isnum(id)) {
            id = cstr(k)
        }
        id = cstr(k)

        //X
        let X = get(col, 'x', null)
        if (!isnum(X)) {
            throw new Error(`col.x[${X}] is not a number`)
        }
        X = cdbl(X)

        //Y
        let Y = get(col, 'y', null)
        if (!isnum(Y)) {
            throw new Error(`col.y[${Y}] is not a number`)
        }
        Y = cdbl(Y)

        //Z
        let Z = get(col, 'z', null)
        if (!isnum(Z)) {
            throw new Error(`col.z[${Z}] is not a number`)
        }
        Z = cdbl(Z)

        //layers
        let layers = get(col, 'layers', [])
        if (!isearr(layers)) {
            throw new Error(`col.layersis not an effective array`)
        }

        //rs
        let rs = []
        await pmSeries(layers, async (layer, k) => {

            //mat, type
            let mat = get(layer, 'mat', 0)
            let type = get(layer, 'type', 0)

            //ds
            let ds = get(layer, 'depthStart', '')
            if (!isnum(ds)) {
                throw new Error(`layers[${k}].depthStart[${ds}] is not a number`)
            }
            ds = cdbl(ds)

            //de
            let de = get(layer, 'depthEnd', '')
            if (!isnum(de)) {
                throw new Error(`layers[${k}].depthEnd[${de}] is not a number`)
            }
            de = cdbl(de)

            //Z1
            let Z1 = Z - ds //Z朝上為正, Z-depthStart為往下至樣本頂部深度
            if (!isnum(Z1)) {
                throw new Error(`Z1[${Z1}] is not a number`)
            }
            Z1 = cdbl(Z1)

            //Z2
            let Z2 = Z - de //Z朝上為正, Z-depthEnd為往下至樣本底部深度
            if (!isnum(Z2)) {
                throw new Error(`Z2[${Z2}] is not a number`)
            }
            Z2 = cdbl(Z2)

            //SoilID, HGUID, HorizonID
            let SoilID = mat
            let HGUID = mat
            let HorizonID = type

            //push, 起訖深度depthStart須先轉為朝下為正, 提供給外部funProcLayers處理, 例如使用mergeByDepthStartEnd進行同質合併
            rs.push({ name: id, X, Y, depthStart: -Z1, depthEnd: -Z2, SoilID, HGUID, HorizonID })

        })
        // console.log('rs', rs)

        //funProcLayers
        if (isfun(funProcLayers)) {
            rs = funProcLayers(rs)
            if (ispm(rs)) {
                rs = await rs
            }
        }

        //push
        rss.push(rs)

    })

    //ls, 產生gms所需各列字串數據
    let ls = []
    each(rss, (rs) => {
        each(rs, (v, k) => {
            let cc = ''

            //各列數據, 起始深度depthStart要再轉朝上為正
            cc = `${v.name},${v.X},${v.Y},${-v.depthStart},${v.SoilID},${v.HGUID},${v.HorizonID}` + '\n'
            ls.push(cc)

            //自動補孔底深度樣本, 結束度要再轉朝上為正
            if (k === size(rs) - 1) {
                cc = `${v.name},${v.X},${v.Y},${-v.depthEnd},${v.SoilID},${v.HGUID},${v.HorizonID}` + '\n'
                ls.push(cc)
            }

        })
    })

    //c
    let c = join(ls, '')

    return c
}


/**
 * 輸出數據至GMS檔案
 *
 * @param {Object|Array} mnes 輸入數據物件或陣列，輸入物件須包含name、cols，輸入陣列時則各元素為物件(name、cols)
 * @param {String} fpOut 輸入儲存檔案位置字串
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {Function} [opt.funProcLayers=null] 輸入交由外部處理分層函數，輸入當前layers並須回傳layers，例如可通過mergeByDepthStartEnd進行同質合併，預設null
 * @return {Promise} 回傳Promise，resolve回傳成功訊息，reject回傳錯誤訊息
 * @example
 *
 * let name = 'abc'
 * let cols = [...]
 * let fpOut = '{path of file}'
 *
 * console.log('writing...')
 * writeGms({ name, cols }, fpOut)
 *     .then((r) => {
 *         console.log('finish.')
 *     })
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 */
async function writeGms(mnes, fpOut, opt = {}) {

    //GMS格式使用: Borehole data
    //http://gmsdocs.aquaveo.com/GMS_User_Manual_10.0_volume4.pdf

    //舊版標題: Name(孔號名稱) X Y Z(分層深度) SoilID(分類編號) HGUID(分類編號) HorizonID
    //新版標題有變更: SoilID->HGUID, HGUID->MaterialID

    //舊版數據格式範例:
    //Name X Y Z SoilID HGUID HorizonID
    //BH-D02 309253.1208 2797847.883 8.65 1 1 27
    //BH-D02 309253.1208 2797847.883 8.43 2 2 26
    //BH-D02 309253.1208 2797847.883 8.03 6 6 25
    //BH-D02 309253.1208 2797847.883 3.45 4 4 24
    //BH-D02 309253.1208 2797847.883 3.1 6 6 22
    //BH-D02 309253.1208 2797847.883 2.35 4 4 20
    //BH-D02 309253.1208 2797847.883 1.65 6 6 19
    //BH-D02 309253.1208 2797847.883 -0.45 4 4 18
    //BH-D02 309253.1208 2797847.883 -1.35 6 6 17
    //BH-D02 309253.1208 2797847.883 -2.05 4 4 14
    //BH-D02 309253.1208 2797847.883 -2.7 6 6 12
    //BH-D02 309253.1208 2797847.883 -4.15 4 4 11
    //BH-D02 309253.1208 2797847.883 -5.0 6 6 9
    //BH-D02 309253.1208 2797847.883 -7.05 7 7 7
    //BH-D02 309253.1208 2797847.883 -8.65 8 8 5
    //BH-D02 309253.1208 2797847.883 -9.15 7 7 2
    //BH-D02 309253.1208 2797847.883 -9.85 8 8 1
    //BH-D02 309253.1208 2797847.883 -21.35 8 8 0
    //BH-D03 309275.1323 2797812.463 9.01 1 1 27
    //BH-D03 309275.1323 2797812.463 8.91 2 2 26
    //BH-D03 309275.1323 2797812.463 8.79 6 6 25
    //BH-D03 309275.1323 2797812.463 6.46 4 4 24
    //BH-D03 309275.1323 2797812.463 6.01 6 6 22
    //BH-D03 309275.1323 2797812.463 3.01 6 6 0
    //BH-D03 309275.1323 2797812.463 -0.99 6 6 0
    //BH-D03 309275.1323 2797812.463 -2.49 6 6 0
    //BH-D03 309275.1323 2797812.463 -4.19 7 7 7
    //BH-D03 309275.1323 2797812.463 -6.04 8 8 5
    //BH-D03 309275.1323 2797812.463 -21.99 8 8 0

    //注意:
    //1.孔號不能有非英文與數字
    //2.每孔樣本要輸出n+1筆，1~n都輸出起始深度，第n+1筆輸出第n筆的結束深度

    //check
    if (!iseobj(mnes) && !isearr(mnes)) {
        throw new Error(`mnes is not an effective object or array`)
    }
    if (iseobj(mnes)) {
        mnes = [mnes]
    }

    //funProcLayers
    let funProcLayers = get(opt, 'funProcLayers', null)

    //head
    let head = `name,X,Y,Z,SoilID,HGUID,HorizonID` + '\n'

    //ct
    let ct = head
    await pmSeries(mnes, async (v) => {

        // //name, gms內沒有寫入name之規格
        // let name = get(v, 'name', '')
        // if (!isestr(name)) {
        //     throw new Error(`invalid name`)
        // }

        //cols
        let cols = get(v, 'cols', [])
        if (!isearr(cols)) {
            throw new Error(`cols is not an effective array`)
        }

        //writeParseCols
        let c = await writeParseCols(cols, funProcLayers)

        //merge
        ct += c + '\n'

    })

    //writeFileSync
    fs.writeFileSync(fpOut, ct, 'utf8')

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
