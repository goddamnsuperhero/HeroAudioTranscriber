var GlobalFuncs = GlobalFuncs || {};
var scriptPaths = new Set();

window.MyApp = {
    globalData: {}
  };
// Generates the url into a an html page and added to the parent.
// if there is a UUID, it will update all elements with id's in the url to add -{uuid} to the end
// id will set the div to have this iD
// classses wil lset the div to have these classes
GlobalFuncs.fetchHtmlAsText = async function fetchHtmlAsText(url,parent,uuid,id,classes) {
    const response = await fetch(url);
    var div = document.createElement('div');
    div.type = 'div';
    if(id)div.id = id
    if(classes)div.className =classes
    div.innerHTML = await response.text();
    if(uuid != null)div = findAllElementsWithNonEmptyId(div, uuid)
    parent.appendChild(div)
    return parent;
  }
  
  // gets all the elements that do have an ID
  function findAllElementsWithNonEmptyId(parent,id) {
    // This selector matches any element that has an ID attribute that is not empty
    elements = parent.querySelectorAll('[id]:not([id=""]):not([uuid])');
    for (let i = 0; i < elements.length; i++) {
        elements[i].setAttribute("uuid",id)
        elements[i].setAttribute("id",elements[i].getAttribute("id")+"-"+id)
      }
      if( parent.hasAttribute('id') && parent.getAttribute('id') !== "" && !parent.hasAttribute('uuid')){
        parent.setAttribute("uuid",id)
        parent.setAttribute("id",parent.getAttribute("id")+"-"+id)
      }
      return parent
}
// generates a new UUID
GlobalFuncs.uuidv4 = function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
  }

  