var curriculum = module.exports = {};

	curriculum.data  = {};
	curriculum.ids   = {};
	curriculum.types = {};

	curriculum.add = function(section, object) 
	{
		object.id = uuidv4();
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
		var newObject = ids[newId];
		var oldObject = ids[id];
		newObject.replaces = [id];
		newObject.unreleased = true;
		oldObject.replacedBy = ids.concat([newId]);
		curriculum.data[section] = curriculum.data[section].filter(function(entity) {
			return entity.id != id;
		});
		deprecated.push(oldObject);
		var parentSections = getParentSections(section);
		var parentProperty = getParentPropert(section);
		if (parentSections.length) {
			parentSections.forEach(function(parentSection) {
				curriculum.replaceLinks(parentSection, parentProperty, id, newId);
			});
		}
	}

	curriculum.replaceLinks = function(section, property, id, newId)
	{
		if (parentSection) {
			curriculum.data[parentSection].filter(
				function(entity) 
				{
					return entity[parentProperty] 
						&& entity[parentProperty].indexOf(id)!=-1;
				}
			).forEach(
				function(entity) 
				{
					var index = entity[parentProperty].indexOf(id);
					if (entity.unreleased) {
						entity[property].splice(index, 1, newId);
					} else {
						// create new object clone
						var newObject = clone(entity);
						// splice the link
						newObject[property].splice(index, 1, newId);
						// replace entity with clone
						newId = add(section, newObject);
						replace(section, entity.id, newId);
					}
				}
			);
		}
	}

	curriculum.getParentSections = function(section) 
	{
		var parentSections = [];
		Object.keys(curriculum.data).forEach(
			function(dataSection) 
			{
				if (typeof curriculum.data[dataSection][getParentProperty(section)] != 'undefined') {
					parentSections.push(dataSection);
				}
			}
		);
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
    			var fileData = JSON.stringify(curriculum.data[propertyName]);
    			fs.writeFileSync(dir+file, fileData);
    		}
    	});
    }

    curriculum.clone = function(object)
    {
    	return JSON.parse(JSON.stringify(object));
    }

