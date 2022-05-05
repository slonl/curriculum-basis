import Curriculum from 'curriculum-js'

async function validate() {

	var curriculum     = new Curriculum()
	var schema         = await curriculum.loadContextFromFile('curriculum-basis', 'context.json');
	var kerndoelSchema = await curriculum.loadContextFromFile('curriculum-kerndoelen', 'curriculum-kerndoelen/context.json');
	var examenprogrammaSchema = await curriculum.loadContextFromFile('curriculum-examenprogramma', 'curriculum-examenprogramma/context.json');
	try {
		let result = await curriculum.validate(schema)
		console.log('Data is valid!')
	} catch(error) {
		console.log(error)
		error.validationErrors.forEach(error => {
			console.log(error.instancePath+': '+error.message)
		})
	}
}

validate()
