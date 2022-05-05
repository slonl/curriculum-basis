import schemaJSON from '../context.json' assert { type: "json"}
import aliasJSON from '../data/alias.json' assert { type: "json"}
import doelenJSON from '../data/doelen.json' assert { type: "json"}
import niveausJSON from '../data/niveaus.json' assert { type: "json"}
import doelniveausJSON from '../data/doelniveaus.json' assert { type: "json"}
import tagsJSON from '../data/tags.json' assert { type: "json"}
import vakleergebiedenJSON from '../data/vakleergebieden.json' assert { type: "json"}

export var data = {
	alias: aliasJSON,
	doelen: doelenJSON,
	niveaus: niveausJSON,
	doelniveaus: doelniveausJSON,
	tags: tagsJSON,
	vakleergebieden: vakleergebiedenJSON
}

export var schema = schemaJSON
export var alias = aliasJSON
export var doelen = doelenJSON
export var niveaus = niveausJSON
export var doelniveaus = doelniveausJSON
export var tags = tagsJSON
export var vakleergebieden = vakleergebiedenJSON
