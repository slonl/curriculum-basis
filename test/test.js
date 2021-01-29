	var Ajv = require('ajv');
	var ajv = new Ajv({
		'extendRefs': true,
		'allErrors': true,
		'jsonPointers': true
	});
	var validate = null;

	ajv.addKeyword('itemTypeReference', {
		validate: function(schema, data, parentSchema, dataPath, parentData, propertyName, rootData) {
			var matches = /.*\#\/definitions\/(.*)/g.exec(schema);
			if (matches) {
				var result = curriculum.types[data] == matches[1];
				return result;
			}
			console.log('Unknown #ref definition: '+schema);
		}
	});

	var curriculum = require('../lib/curriculum.js');
	var schema     = curriculum.loadSchema('context.json');
	var kerndoelSchema = curriculum.loadSchema('curriculum-kerndoelen/context.json', 'curriculum-kerndoelen/');
	var examenprogrammaSchema = curriculum.loadSchema('curriculum-examenprogramma/context.json', 'curriculum-examenprogramma/');

	var valid = ajv.addSchema(kerndoelSchema, 'https://opendata.slo.nl/curriculum/schemas/curriculum-kerndoelen/context.json')
			.addSchema(examenprogrammaSchema, 'https://opendata.slo.nl/curriculum/schemas/curriculum-examenprogramma/context.json')
			.addSchema(schema, 'https://opendata.slo.nl/curriculum/schemas/curriculum-basis/context.json')
	               .validate('https://opendata.slo.nl/curriculum/schemas/curriculum-basis/context.json', curriculum.data);

	if (!valid) {
		ajv.errors.forEach(function(error) {
			console.log(error.dataPath+': '+error.message);
		});
		console.log('data is invalid');
		process.exit(1);
	} else {
		console.log('data is valid!');
	}
