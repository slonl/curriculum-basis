    import Curriculum from 'curriculum-js';
    import repl from 'repl';
    import { data, schema } from '../src/index.mjs';

    var curriculum = new Curriculum()

    curriculum.loadContext(schema, data)

    var server = repl.start({
        ignoreUndefined: true
    });
    server.context.basis = { data: data, schema: schema }
    server.context.curriculum = curriculum;
    if (process.env.NODE_REPL_HISTORY) {
        server.setupHistory(process.env.NODE_REPL_HISTORY, (e) => { if (e) console.log(e); } );
    } else {
        console.log('Set environment variable NODE_REPL_HISTORY=.repl_history to enable persistent REPL history');
    }
