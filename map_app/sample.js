jsonObj = {
    Objects:
};

var i;

function addobst(id, obst) {
    var x = {
	ident: id
	obsticle: obst
    }

    jsonObj.Objects[0] = x;
}

addobst(0, 'obsticle');
console.log(jsonObj);
