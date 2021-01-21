import {NodeVM} from 'vm2'

const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
        external: {
            transitive:true,
            modules:['*']
        },
        root: "./never/ever"
    }
})

export default vm