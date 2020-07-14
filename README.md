# curriculum-basis: SLO Curriculum core dataset

This repository contains the core curriculum dataset. The dataset is defined by the `context.json` JSON Schema file. 

## installation

```
git clone https://github.com/slonl/curriculum-basis.git
cd curriculum-basis
git submodule init
git submodule update
npm install
```

You can validate the dataset by running the test command:

```
npm test
```

## contents

This dataset contains the following collections:

- doel: A list of educational goals
- kerndoel: The core educational goals
- niveau: Educational levels
- alias: Alternative titles and descriptions for some entities
- doelniveau: A list linking doel and niveau
- deprecated: A list of deprecated entities

Each entity has a universally unique identifier (UUID). Once assigned (and released) these will never change or disappear, although they may be deprecated. Entities start out as 'unreleased', and will have a property `unreleased: true`. This means that their contents may change and you shouldn't use their UUID anywhere outside the dataset yet. Unreleased UUID can be deleted and won't be listed in the deprecated collection.

Entities that are released have no `unreleased` property and will be in (or under) a tagged release commit. Dataset releases will use the Github release tags. Once an entity is released, the UUID will be kept and the data associated with that UUID will never change. Released entities are immutable. They can only be deprecated. 

Deprecated entities have all their original data, with two additional properties:
- `types`
- `replacedBy`

The `types` property is a list of the original type(s) of the deprecated entity. Normally this should just contain one type, but the legacy data used identical UUID's for entities in different roles.

The `replacedBy` property is a list of new UUID's that supercede this one. An entity may be split into more than one if the children it links to are split over two or more new entities for example.

## curriculum.js

This dataset also contains code to load and alter the dataset. This is written in javascript meant for nodejs.

### curriculum.loadSchema
`schema curriculum.loadSchema(string schemaFilename, string repositoryPath)`

```
  var curriculum = require('curriculum-basis/lib/curriculum.js');
  var schema     = curriculum.loadSchema('context.json','curriculum-basis/');
```
Once loaded you can access the dataset collections under the `curriculum.data` property:

```
  var vakken = curriculum.data.vak;
```

There is also a UUID index at `curriculum.ids` and a types index at `curriculum.types`

### curriculum.add
`uuid curriculum.add(string collection, object entity)`

This will add the new entity in the specified collection. If the entity has no UUID, one will be generated. The entities UUID is returned.

### curriculum.update
`uuid curriculum.update(string collection, uuid id, diff)`

The diff must be in the format used by jsondiffpatch (npm install jsondiffpatch).

If the entity with the given id is unreleased, this will simply apply the diff to that entity and return its id. 

If the entity is released, the data for this entity can't change, so a new unreleased entity is created. This will have all the original data, merged with the diff given. In addition the original entity will be deprecated and all entities linking to it will also be updated to link to the new unreleased entity instead. Since those entities might also be released and thus immutable, this will continue untill no links to deprecated entities are found. The new UUID for the originally modified entity will be returned.

### curriculum.replace
`void curriculum.replace(string collection, uuid id, uuid newID, ...ids)`

This function replaces an existing entity with one or more new entities. The new entities must have been added using curriculum.add() before. curriculum.replace() will deprecate the original entity and replace all links to it with the given `newID`. Any additional links to the other ids need to be added manually. The full list of `ids` (including `newID`) is added to the original deprecated entity in the `replacedBy` property. Each of the entities in the full list of `ids` gains the deprecated id in their `replaces` properties.

### curriculum.exportFiles
`void curriculum.exportFiles(schema, string repositoryPath)`

This function writes all data back to their corresponding json files, as defined in the JSON schema file originally loaded.


## validating the data

Running the test script validates the dataset:

```
npm test
```

This uses the `context.json` JSON schema for validation. The JSON schema has two custom extensions:

- `#file` contains the path to retrieve and export each collection from and to
- `itemTypeReference` specifies what type each uuid identifier should map to
