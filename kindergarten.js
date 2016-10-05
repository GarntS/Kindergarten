/**
 * Filename:	kindergarten.js
 * Author:		Grant Spencer
 * Date:		9/30/2016
 * Description:	An implementation of Naive-Bayes Classification that implements simple modular training of the
 * 				classifier. It understands simply. Like kids in Kindergarten.
 */

var natural = require('natural');
var fs = require('fs');
var _ = require('lodash');
var promise = require('promise');
var mutex = require('node-mutex')();

//

var classifiers = {};

//

//Does file exist?
var exists = function(filename) {
	try {
		fs.accessSync(filename);
		return true;
	}
	catch(e) {
		log('Can\'t access file: '+ filename+ '\n');
		return false;
	}
};

//Formatted logger function
var log = function(msg) {
	console.log('[kinder] '+ JSON.stringify(msg));
};

//Create new classifier
var create_classifier = function(name) {
	if(_.has(classifiers, name)) {
		log('Cannot create preexisting classifier: '+ name);
	}

	classifiers[name] = new natural.BayesClassifier();
	log('Created Classifier: '+ name);
};

//Delete existing classifier
var delete_classifier = function(name) {
	//Kill if no classifier
	if(!_.has(classifiers, name)) {
		log('Can\'t delete nonexistent classifier: '+ name);
		return;
	}

	//Lock the classifier's mutex
	mutex
		.lock('classifier-'+ name)
		.then( function(unlock) {
			classifiers[name] = null;
			log('Deleted Classifier: ' + name);

			//Unlock the classifier's mutex
			unlock();
		});
};

//Train the classifier with an array of documents
var train = function(documents, name) {
	//Kill if no documents
	if(!documents.length > 0) {
		log('No documents to train with.');
		return;
	}

	//Kill if no classifier
	if(!_.has(classifiers, name)) {
		log('Can\'t train nonexistent classifier: '+ name);
	}

	//Lock the classifier's mutex
	mutex
		.lock('classifier-'+ name)
		.then( function(unlock) {
			classifiers[name] = new natural.BayesClassifier();
			_.each(documents, function(doc) {
				classifiers[name].addDocument(doc.text, doc.classification);
			});

			//Train
			classifiers[name].train();

			//Unlock the mutex
			unlock();
		});
};

//Train the classifier with the contents of the JSON file at <filename>
var train_from_JSON = function(filename, name) {
	//Kill if file doesn't exist
	if(!exists(filename)) {
		return;
	}

	var documents = JSON.parse(fs.readFileSync(filename, 'utf-8'));
	train(documents, name);
};

//

//Actually make it work for a living. Returns the classification as a string.
var classify = function(text, name) {
	if(!_.has(classifiers, name)) {
		log('Classifier '+ name+ 'does not exist');
		return '';
	}

	//Lock the classifier's mutex
	mutex
		.lock('classifier-'+ name)
		.then( function(unlock) {
			var classification = classifiers[name].classify(text);

			unlock();

			return classification;
		});
};

//Make it work slightly harder for its living. Returns more detailed information.
var classify_details = function(text) {
	if(!_.has(classifiers, name)) {
		log('Classifier '+ name+ 'does not exist');
		return '';
	}

	//Lock the classifier's mutex
	mutex
		.lock('classifier-'+ name)
		.then( function(unlock) {
			var classification = classifiers[name].getClassifications(text);

			unlock();

			return classification;
		});
};

//

exports.create_classifier = create_classifier;
exports.delete_classifier = delete_classifier;
exports.train = train;
exports.train_from_JSON = train_from_JSON;
exports.classify = classify;
exports.classifiy_details = classify_details;