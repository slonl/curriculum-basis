// load the curriculum-js library
import Curriculum from 'curriculum-js'
// load node filesystem support
import fs from 'fs'
import repl from 'repl';

// create an async function, so we can use await inside it
async function main() {

    // create new curriculum instance
    const curriculum = new Curriculum()

    // read the list of all contexts from the file /curriculum-contexts.txt
    const schemas = fs.readFileSync('curriculum-contexts.txt','utf8')
        .split(/\n/g)             // split the file on newlines
        .map(line => line.trim()) // remove leading and trailing whitespace
        .filter(Boolean)          // filter empty lines

    // load all contexts from the editor/ and master/ folders
    let loadedSchemas = schemas.map(
        schema => curriculum.loadContextFromFile(schema, schema+'/context.json')
    ).concat(
        curriculum.loadContextFromFile('curriculum-basis', 'context.json')
    )

    // wait untill all contexts have been loaded, and return the promise values as schemas
    Promise.allSettled(loadedSchemas).then((settledSchemas) => {
        loadedSchemas = settledSchemas.map(promise => promise.value)
    })
    .then(() => {

        var server = repl.start({
            ignoreUndefined: true
        });

        server.context.curriculum = curriculum;
        if (process.env.NODE_REPL_HISTORY) {
            server.setupHistory(process.env.NODE_REPL_HISTORY, (e) => { if (e) console.log(e); } );
        } else {
            console.log('Set environment variable NODE_REPL_HISTORY=.repl_history to enable persistent REPL history');
        }

    })
}

main()