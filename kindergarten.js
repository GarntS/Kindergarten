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

var classifier = new natural.BayesClassifier();

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
}

//Formatted logger function
var log = function(msg) {
	console.log('[kinder] '+ JSON.stringify(msg));
}

//Train the classifier with an array of documents
var train = function(documents) {
	//Kill if no documents
	if(!documents.length > 0) {
		log('No documents to train with.');
		return;
	}

	//Lock the classifier mutex
	mutex
		.lock('classifier')
		.then( function(unlock) {
			classifier = new natural.BayesClassifier();
			_.each(documents, function(doc) {
				classifier.addDocument(doc.text, doc.classification);
			});

			//Train
			classifier.train();

			//Unlock the mutex
			unlock();
		});
};

//Train the classifier with the contents of the JSON file at <filename>
var train_from_JSON = function(filename) {
	//Kill if file doesn't exist
	if(!exists(filename)) {
		return;
	}

	var documents = JSON.parse(fs.readFileSync(filename, 'utf-8'));
	train(documents);
};

//

//Actually make it work for a living. Returns the classification as a string.
var classify = function(text) {
	return classifier.classify(text);
}

//Make it work slightly harder for its living. Returns more detailed information.
var classify_details = function(text) {
	return classifier.getClassifications(text);
}

//

exports.train = train;
exports.train_from_JSON = train_from_JSON;
exports.classify = classify;
exports.classifiy_details = classify_details;