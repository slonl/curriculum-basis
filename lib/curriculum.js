"use strict";
var curriculum = module.exports = {};

	curriculum.data    = {};
	curriculum.ids     = {};
	curriculum.types   = {};
	curriculum.schemas = [];

	curriculum.add = function(section, object) 
	{
		const uuidv4 = require('uuid/v4');
		if (!object.id) {
			object.id = uuidv4();
		}
//		console.log('add: '+object.id+' in '+section);
//		console.log(JSON.stringify(object));
		object.unreleased = true;
		curriculum.data[section].push(object);
		curriculum.ids[object.id] = object;
		curriculum.types[object.id] = section;
		return object.id;
	}


	curriculum.update = function(section, id, diff)
	{
		const uuidv4 = require('uuid/v4');
		const jsondiffpatch = require('jsondiffpatch');
//		console.log('update: '+id);
//		console.log(JSON.stringify(diff));
		var entity = curriculum.ids[id];
		var clone = curriculum.clone(entity);
		jsondiffpatch.patch(clone, diff);
		// check if entity must be deprecated
		// if so check that clone.id is not entity.id
		// if so create a new id for clone
		if (typeof entity.unreleased == 'undefined' || !entity.unreleased) {
			if (section=='deprecated') {
				// updating a deprecated entity, so only the replacedBy may be updated
				if (Object.keys(diff).length>1 || typeof diff.replacedBy == 'undefined') {
					throw new Error('illegal deprecated entity update '+id+': '+JSON.stringify(diff));
				}
			}
			if (clone.id == entity.id) {
				clone.id = uuidv4();
			}
			curriculum.add(section, clone);
			curriculum.replace(section, entity.id, clone.id);
		} else {
			// no need to deprecate entity, just update its contents
			if (clone.id!=entity.id) {
				throw new Error('update cannot change entity id');
			}
			entity = jsondiffpatch.patch(entity, diff);
		}
		return entity.id;
	}

	/**
	 * Replace an entity with a new entity
	 * Find all links to the old entity and replace the links
	 * add replacedBy in old entity
	 * add replaces in new entity
	 */
	curriculum.replace = function(section, id, newId, ...ids) 
	{
//		console.log('replace: '+id+' with '+newId+' in '+section);
//		console.log('replacedBy: '+JSON.stringify(ids.concat([newId])));
		var newObject = curriculum.ids[newId];
		var oldObject = curriculum.ids[id];

		if (!oldObject.unreleased) {
			if (!newObject.replaces) {
				newObject.replaces = [];
			}
			newObject.replaces.push(id);
			
			// unfreeze object so we can deprecate it
			oldObject = curriculum.clone(oldObject);
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
						var newObjectId = curriculum.add(section, newObject);
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
					if (!curriculum.data[propertyName]) {
						curriculum.data[propertyName] = [];
					}
					let entities = JSON.parse(fileData);
					curriculum.data[propertyName] = curriculum.data[propertyName].concat(entities);
					if (typeof curriculum.data[propertyName] == 'undefined') {
						console.log(propertyName+' not parsed correctly');
					} else if (typeof curriculum.data[propertyName].length == 'undefined') {
						console.log(propertyName+' has no length');
					} else {
						console.log(curriculum.data[propertyName].length + ' items found');
					}
					entities.forEach(function(entity) {
						if (entity.id) {
							if (curriculum.ids[entity.id]) {
								console.log('Duplicate id in '+propertyName+': '+entity.id,
									curriculum.ids[entity.id], entity);
							} else {
								curriculum.ids[entity.id] = entity;
								curriculum.types[entity.id] = propertyName;
							}
							if (typeof entity.unreleased == 'undefined') {
								Object.freeze(entity);
							}
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

