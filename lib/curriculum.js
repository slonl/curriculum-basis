var curriculum = module.exports = {};

	curriculum.data    = {};
	curriculum.ids     = {};
	curriculum.types   = {};
	curriculum.schemas = [];

	curriculum.add = function(section, object) 
	{
		const uuidv4 = require('uuid/v4');
		object.id = uuidv4();
		object.unreleased = true;
		curriculum.data[section].push(object);
		curriculum.ids[object.id] = object;
		curriculum.types[object.id] = section;
		return object.id;
	}

	/**
	 * Replace an entity with a new entity
	 * Find all links to the old entity and replace the links
	 * add replacedBy in old entity
	 * add replaces in new entity
	 */
	curriculum.replace = function(section, id, newId, ...ids) 
	{
		// console.log('replacing '+id+' with '+newId+' in '+section);
		var newObject = curriculum.ids[newId];
		var oldObject = curriculum.ids[id];

		if (!oldObject.unreleased) {
			if (!newObject.replaces) {
				newObject.replaces = [];
			}
			newObject.replaces.push(id);

			if (!oldObject.replacedBy) {
				oldObject.replacedBy = [];
			}
			oldObject.replacedBy = oldObject.replacedBy.concat(ids.concat([newId]));
		}
		if (!newObject.unreleased) {
			throw new Error('replace can only replace with unreleased objects');
		}
		
		if (!oldObject.types) {
			oldObject.types = [];
		}
		oldObject.types.push(section);

		curriculum.data[section] = curriculum.data[section].filter(function(entity) {
			return entity.id != id;
		});

		if (!oldObject.unreleased) {
			if (curriculum.types[oldObject.id]!='deprecated') {
				curriculum.data.deprecated.push(oldObject);
				curriculum.types[oldObject.id] = 'deprecated';
			}
		}

		var parentSections = curriculum.getParentSections(section);
		var parentProperty = curriculum.getParentProperty(section);
//		console.log('replacing links for '+section+' '+id, parentSections);
		if (parentSections.length) {
			parentSections.forEach(function(parentSection) {
				curriculum.replaceLinks(parentSection, parentProperty, id, newId);
			});
//			console.log('replacing links done for '+section+' '+id);
		} else {
//			console.log('skipped replacing links');
		}
	}

	curriculum.replaceLinks = function(section, property, id, newId)
	{
		if (section) {
			curriculum.data[section].filter(
				function(entity) 
				{
					return entity[property] 
						&& entity[property].indexOf(id)!=-1;
				}
			).forEach(
				function(entity) 
				{
//					console.log('replacing links in '+entity.id+' '+property+' from '+id+' to '+newId);
					var index = entity[property].indexOf(id);
					if (entity.unreleased) {
						entity[property].splice(index, 1, newId);
					} else {
						// create new object clone
						var newObject = curriculum.clone(entity);
						// splice the link
						newObject[property].splice(index, 1, newId);
						// replace entity with clone
						newObjectId = curriculum.add(section, newObject);
						curriculum.replace(section, entity.id, newObjectId);
					}
				}
			);
		}
	}

	curriculum.getParentSections = function(section) 
	{
		var parentSections = [];
		var parentProperty = curriculum.getParentProperty(section);
		curriculum.schemas.forEach(function(schema) {
			Object.keys(schema.definitions).forEach(
				function(schemaSection) 
				{
					if (typeof schema.definitions[schemaSection].properties != 'undefined' 
						&& typeof schema.definitions[schemaSection].properties[parentProperty] != 'undefined'
					) {
						parentSections.push(schemaSection);
					}
				}
			);
		});
		return parentSections;
	}

	curriculum.getParentProperty = function(section) 
	{
		return section+'_id';
	}

    curriculum.loadSchema = function(name, dir='') {
		var fs = require('fs');
        var context = fs.readFileSync(name,'utf-8')
        var schema = JSON.parse(context);
        curriculum.schemas.push(schema);

        var properties = Object.keys(schema.properties);
        properties.forEach(function(propertyName) {
            if (typeof schema.properties[propertyName]['#file'] != 'undefined') {
                var file = schema.properties[propertyName]['#file'];
                var fileData = fs.readFileSync(dir+file, 'utf-8');
                    console.log(propertyName+': reading '+dir+file);
                    curriculum.data[propertyName] = JSON.parse(fileData);
                    if (typeof curriculum.data[propertyName] == 'undefined') {
                        console.log(propertyName+' not parsed correctly');
                    } else if (typeof curriculum.data[propertyName].length == 'undefined') {
                        console.log(propertyName+' has no length');
                    } else {
                        console.log(curriculum.data[propertyName].length + ' items found');
                    }
                    curriculum.data[propertyName].forEach(function(entity) {
                        if (curriculum.ids[entity.id]) {
                            console.log('Duplicate id in '+propertyName+': '+entity.id,
                                curriculum.ids[entity.id], entity);
                        } else {
                            curriculum.ids[entity.id] = entity;
                            curriculum.types[entity.id] = propertyName;
                        }
                    });
            } else {
                console.log('skipping '+propertyName);
            }
        });
        return schema;
    }

    curriculum.exportFiles = function(schema, dir='')
    {
		var fs = require('fs');
        var properties = Object.keys(schema.properties);
        properties.forEach(function(propertyName) {
            if (typeof schema.properties[propertyName]['#file'] != 'undefined') {
                var file = schema.properties[propertyName]['#file'];
    			var fileData = JSON.stringify(curriculum.data[propertyName], null, "\t");
    			fs.writeFileSync(dir+file, fileData);
    		}
    	});
    }

    curriculum.clone = function(object)
    {
    	return JSON.parse(JSON.stringify(object));
    }

