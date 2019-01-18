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

	var valid = ajv.addSchema(schema, 'http://opendata.slo.nl/curriculum/schemas/doelen')
	               .validate('http://opendata.slo.nl/curriculum/schemas/doelen', curriculum.data);

	if (!valid) {
		ajv.errors.forEach(function(error) {
			console.log(error.dataPath+': '+error.message);
		});
		console.log('data is invalid');
	} else {
		console.log('data is valid!');
	}
