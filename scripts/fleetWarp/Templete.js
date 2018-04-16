var regexp_templete_valueExpression = /\{\{\s*([^\{\}\[\]]*)\s*\}\}/g;
var regexp_templete_valueExpressionAlt = /\[\[([^\[\]]*)\]\]/g;
var regexp_templete_subTempleteKey = /\w+/;
var regexp_commentBlock = /\<\!(\-\-(\w|[\r\n]|[^\-]|\-[^\-])*\-\-)\>/g;

Node.prototype.connectedModel = null;
Node.prototype.modelKey = null;

/*

	input과 editableContent에 대해 값 변경 이벤트로부터 모델에 피드백처리.

	subTempleteStorage는 특정 key가 생성한 subTemplete을 array로 가지고 있다.

	커넥터가 덮어쓰기 되면 안됨.

*/

//Templete
/*
	: Templete Class represents a 2-way View-Model connection.

	Text templeteAddressor
	Array<Node> rootNodes
	string rawHTML

	this.parentTemplete
	Array<Templete> this.childTempletes

	Object modelStorage
	Object modelConnectors
	Object model

	updateView()
	insertInto(addressor)
	destroy()
*/
var Templete = function(targetElement, model, connectors) {
	if (typeof targetElement == "string") {
		if (!(targetElement = document.getElementById(targetElement))) {
			console.error("targetElement must be an Element or exist ID string.");
			return false;
		}
	}
	var rootElement = targetElement;

	this.templeteAddressor = document.createTextNode("");
	this.rootNodes = new Array();
	this.rawHTML = rootElement.innerHTML;

	this.parentTemplete = null;
	this.childTempletes = [];

	this.modelStorage = {};
	this.modelConnectors = typeof connectors == "undefined"?modelConnect(model):connectors;
	this.model = model;
	
	this.updateView = function() {
		//include 할 때 코멘트를 없앨것이므로 템플릿에선 코멘트를 삭제하지 말아야 서브템플릿을 인지 할 수 있게됨.
		rootElement.innerHTML = this.rawHTML.replace(regexp_templete_valueExpression, "[[$1]]");//.replace(regexp_commentBlock, "");//change value expressions and remove comments

		var queue_nodeVisit = new Array();
		queue_nodeVisit.push(rootElement);
		while(queue_nodeVisit.length) {
			var node = queue_nodeVisit.shift();
			if (node instanceof Text) {
				var textNode = node;
				//change expressions of textNode to proper model data value.

				var queue_text = new Array();
				queue_text.push(textNode);
				while (queue_text.length) {
					var node = queue_text.shift();

					var matchData = null;
					if (matchData = regexp_templete_valueExpressionAlt.exec(node.nodeValue)) {
						var key = matchData[1].trim();
						var value = (typeof model[key] == "undefined"?"":model[key]);

						node.nodeValue = node.nodeValue.substr(0, matchData.index); //save non-expression text in front of expressionNode.
						var expressionNode = document.createTextNode(value);	//expression Node.

						this.modelStorage[key] = value; //save value
						if (typeof this.modelConnectors[key] == "undefined") {
							console.error("member '"+key+"' doesn't exist on Referenced model.");
							//[Fixing Point] there need to still connection between connectors and model, even if the proper value doesn't exist. expression should make new member to model.
						}
						else {
							this.modelConnectors[key].targets.push(expressionNode);	//add node to connection list.

							//data binding
							Object.defineProperty(model, key, {
								get : dataBindingGetter(this, key),
								set : dataBindingSetter(this, key),
								configurable : true
							});
							//expressionNode.nodeValue = value; //better performance
							//model[key] = value
							//binding end.
						}
						node.parentNode.insertAfter(expressionNode, node);

						var remainingText = matchData.input.substr(regexp_templete_valueExpressionAlt.lastIndex, matchData.input.length);
						if (remainingText) { //there is more text to parse
							var remainingTextNode = document.createTextNode(remainingText); //create new text node contains remaining text
							node.parentNode.insertAfter(remainingTextNode, expressionNode); //insert remaining text after expressionNode

							queue_text.push(remainingTextNode); //loop
						}
						regexp_templete_valueExpressionAlt.lastIndex = 0; //initialize and make ready regular expression
					}
				}
			}
			else if (node instanceof Element) { //element
				//check node attributes wheather the attribute is containing expression.
				for (var i=0;i<node.attributes.length;i++) {
					var attr = node.attributes[i];

					var matchData = null;
					if (matchData = regexp_templete_valueExpressionAlt.exec(attr.value)) { //expression found.
						var key = matchData[1].trim();

						regexp_templete_valueExpressionAlt.lastIndex = 0;
						var value = typeof model[key] == "undefined"?"":model[key];

						this.modelStorage[key] = value; //save value
						
						if (typeof this.modelConnectors[key] == "undefined") {
							this.modelConnectors[key] = new ModelConnector();
							
							console.error("member '"+key+"' doesn't exist on Referenced model.");
							//[Fixing Point] there need to still connection between connectors and model, even if the proper value doesn't exist. expression should make new member to model.
						}
						this.modelConnectors[key].targets.push(attr);	//add node to connection list.

						//data binding
						Object.defineProperty(model, key, {
							get : dataBindingGetter(this, key),
							set : dataBindingSetter(this, key),
							configurable : true
						});
						//binding end.


						attr.value = attr.value.replace(regexp_templete_valueExpressionAlt, (typeof model[key] == "undefined"?"":model[key])); //better performance
						//model[key] = value;

					}//if (matchData = regexp_templete_valueExpressionAlt.exec(attr.value))
					regexp_templete_valueExpressionAlt.lastIndex = 0;
				}//attribute search end.

				//if the node has childNodes
				if (node.childNodes.length) {
					node.childNodes.forEach(function(item) {
						queue_nodeVisit.push(item);
					});
				}
				if (node.tagName && (node.tagName == "a" || node.tagName == "A")) {
					node.addEventListener("click", Router.hyperLinkRouting);
				}
			}
			else if (node instanceof Comment) { //subTemplete

				if (node.nodeValue[0] == "!") {
					node.nodeValue = node.nodeValue.substr(1);
					continue;
				}

				var key = regexp_templete_subTempleteKey.exec(node.nodeValue)[0];
				var value = (typeof model[key] == "undefined"?"":model[key]);

				this.modelStorage[key] = value; //save value

				var htmlTempleteCode = changeSubTempleteExpressionToComment(node.nodeValue.replace(regexp_templete_subTempleteKey, "").trim());

				node.parentNode.insertBefore(this.templeteAddressor, node); //insert addressor
				node.parentNode.removeChild(node);

				var subModelList = null;
				if (isObject(value)) {	//value is Object
					subModelList = new Array(value);
				}
				else if (isArray(value)) {	//value is Array
					subModelList = value;
				}

				var subTempletes = new Array();

				//data Binding
				Object.defineProperty(model, key, {
					get : dataBindingGetter(this, key),
					set : dataBindingSetter(this, key),
					configurable : true
				});
				//binding end.
				if (typeof this.modelConnectors[key] == "undefined") {
					console.error("member '"+key+"' doesn't exist on Referenced model.");
					//[Fixing Point] there need to still connection between connectors and model, even if the proper value doesn't exist. expression should make new member to model.
				}
				else {
					this.modelStorage[key] = value; //save value

					for (var i in subModelList) {
						var subModel = subModelList[i];
						var temporalRoot = document.createElement("tbody");
						temporalRoot.innerHTML = htmlTempleteCode;
						var subTemplete = new Templete(temporalRoot, subModel, this.modelConnectors[key].childConnectors[i].childConnectors);
						subTemplete.insertInto(this.templeteAddressor);
						subTemplete.parentTemplete = this;
						this.childTempletes.push(subTemplete);
						subTempletes.push(subTemplete);
					}
					this.modelConnectors[key].targets.push(new SubTempleteGroup(htmlTempleteCode, this.templeteAddressor, subTempletes));	//add node to connection list.
				}

			}
		}//while end

		//save all 1 depth nodes
		for (var i=0;i<rootElement.childNodes.length;i++) {
			this.rootNodes.push(rootElement.childNodes[i]);
		}
	}//end if updateView()
	this.updateView();

	this.insertInto = function(addressor) {
		for (var i in this.rootNodes) {
			addressor.parentNode.insertBefore(this.rootNodes[i], addressor);
		}
	}

	this.destroy = function() {
	/*
	
		.destroy 메소드는 subTempleteStorage에 저장된 모든 템플릿의 destroy 메소드를 실행시키고, 
		자기 자신의 rootNodes의 모든 노드를 릴리즈한다. 동시에 model의 모든 키를 delete해서 클로저를 릴리즈하고,
		storage에 저장된 value를 model에 반환한 뒤 storage도 파괴한다.
		=> 상위 템플릿의 destroy는 모든 하위 템플릿도 destroy 한다.

	*/
		
		for (var i in this.rootNodes) {
			this.rootNodes[i].parentNode.removeChild(this.rootNodes[i]);
		}
	}
}

//SubTempleteGroup
/*
	__constructor(string htmlSource, Text addressor, Array<Templete> subTempletes)
*/
var SubTempleteGroup = function(htmlSource, addressor, subTempletes) {
	this.htmlSource = htmlSource;
	this.addressor = addressor;
	this.subTempletes = subTempletes;
}

//ModelConnector
/*
	: ModelConnector Class represents connection to targeted nodes for value update events of key.
	__constructor()

	Array<Node> targets
	ModelConnector childConnectors
*/
var ModelConnector = function() {
	this.targets = new Array();
	this.childConnectors = null;
}


//support functions. there's no necessary to end user
var dataBindingGetter = function(templete, key) {
	return function() {
		return templete.modelStorage[key];
	}
}
var dataBindingSetter = function(templete, key) {
	var model = templete.model;
	var connectors = templete.modelConnectors;
	var addressor = templete.templeteAddressor;
	return function(value) {
		if (isObject(value) || isArray(value)) {
			//change to object
			for (var i in connectors[key].targets) {	//search all connected node for this member
				if (connectors[key].targets[i] instanceof Text) {	//node is textNode
					connectors[key].targets[i].nodeValue = JSON.stringify(value);
				}
				else if (connectors[key].targets[i] instanceof Attr) {	//node is attribute
					connectors[key].targets[i].value = JSON.stringify(value);
				}
				else if (connectors[key].targets[i] instanceof SubTempleteGroup) {
					var subTemplete = connectors[key].targets[i];

					var subModelList = null;
					if (isObject(value)) {	//value is Object
						subModelList = new Array(value);
					}
					else if (isArray(value)) {	//value is Array
						subModelList = value;
					}

					for (var i in subModelList) {
						var subModel = subModelList[i];
						var temporalRoot = document.createElement("table");
						temporalRoot.innerHTML = subTemplete.htmlSource;

						var templete = new Templete(temporalRoot, subModel);
						templete.insertInto(addressor);
						//templete.parentTemplete = templete;
						//templete.childTempletes.push(templete);
					}
				}
			}

			connectors[key].value = value;	//save value
		}
		else {
			//change to value
			for (var i in connectors[key].targets) {	//search all connected node for this member
				if (connectors[key].targets[i] instanceof Text) {	//node is textNode
					connectors[key].targets[i].nodeValue = value;
				}
				else if (connectors[key].targets[i] instanceof Attr) {	//node is attribute
					connectors[key].targets[i].value = value;
				}
				else if (connectors[key].targets[i] instanceof SubTempleteGroup) {
					var node_replacement = document.createTextNode(value);

					connectors[key].targets[i].addressor.parentNode.insertBefore(node_replacement, connectors[key].targets[i].addressor);
					//connectors[key][i].destroy();
					connectors[key].targets[i] = node_replacement;
				}
			}
			connectors[key].value = value;
		}
	}
}//dataBindingSetter() end

var changeSubTempleteExpressionToComment = function(text_source) {
	if (typeof text_source != "string"){
		console.error("the argument of changeSubTempleteExpressionToComment() must be a string");
		return false;
	}
	text_source = text_source.trim();

	var sourceLength = text_source.length;
	var i,	blockCount = 0, start = 0, end = 0;
	var regexp_subTempleteStartBlock = /\{\{\s*[^\}\s]+\s+(?!\})/g;

	var matchData = null;
	while (matchData = regexp_subTempleteStartBlock.exec(text_source)) {
		//found new open block
		start = matchData.index;
		blockCount = 1;

		for (i=start+2;i<text_source.length;i++) {
			var substr = text_source.substr(i,2);
			if (substr == "}}") {
				blockCount--;
			}
			else if (substr == "{{") {
				blockCount++;
			}
			if (blockCount == 0) {
				break;
			}
		}
		end = i;
		regexp_subTempleteStartBlock.lastIndex = end+2;

		var front = text_source.substr(0, start);
		var innerSource = text_source.substr(start+2, end-start-2);
		var back = text_source.substr(end+2, sourceLength);

		text_source = front + "<!--" + innerSource + "-->" + back;
		start = end+3;
	}
	return text_source;
}

var modelConnect = function(model) {
	var modelConnectors = null;
	if (isObject(model)) {
		modelConnectors = {};
	}
	else if (isArray(model)) {
		modelConnectors = [];
	}

	for (var key in model) {
		var value = model[key];
		modelConnectors[key] = new ModelConnector();

		if (isArray(value) || isObject(value)) {
			modelConnectors[key].childConnectors = modelConnect(value);
		}
	}
	return modelConnectors;
}
