/**
 * 我们经常会打印一些日志来辅助调试，但是有的时候会不知道日志是在哪个地方打印的。
 * 希望通过 babel 能够自动在 console.log 等 api 中插入文件名和行列号的参数，方便定位到代码。
 */


const parser = require('@babel/parser');
// @babel/traverse对ast进行遍历的工具吗，有一点类似于字符串的replace方法，主要是对AST进行一些增删改
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
// babel/types对AST 的判断、创建、修改
const types = require('@babel/types');
const template = require('@babel/template')



const sourceCode = `
    console.log(1);

    function func() {
        console.info(2);
    }

    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

const ast = parser.parse(sourceCode, {
    /**
     * sourceType：指示分析代码的模式，默认为script
     * 1. script
     * 2. unambiguous： 根据内容是否包含 import、export 来自动设置 moduleType
     * 3. module
     */
    sourceType: 'unambiguous',
    // 上面的代码中用到了js，所以需要开启一下jsx的plugin
    plugins: ['jsx']
})
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);
// 在console中增加代码所在位置
// traverse(ast, {
//     // 针对特定节点进行操作
//     CallExpression (path, state) {
//         const calleeName = generate(path.node.callee).code;
//         if ( targetCalleeName.includes(calleeName)
//             && path.node.callee.object.name === 'console' 
//             && ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name) 
//            ) {
//             const { line, column } = path.node.loc.start;
//             path.node.arguments.unshift(types.stringLiteral(`line:(${line}, column:${column})`))
//         }
//     }
// });
// 在console之前插入一个console
traverse(ast, {
    CallExpression(path, state){
        if (path.node.isNew) return
        const calleeName = generate(path.node.callee).code
        if (targetCalleeName.includes(calleeName)) {
            const { line,column } = path.node.loc.start
            const newNode = template.expression(`console.log("filename: (${line}, ${column})")`)();
            newNode.isNew = true
            if (path.findParent(path => path.isJSXElement())) {
                path.replaceWith(types.arrayExpression([newNode,path.node]))
                path.skip()
            } else {
                path.insertBefore(newNode)
            }
        }
    }
})


const { code,map } = generate(ast)

console.log(code)