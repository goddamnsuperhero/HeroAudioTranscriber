var GlobalFuncs = GlobalFuncs || {};
var scriptPaths = new Set();

window.MyApp = {
    globalData: {}
  };

GlobalFuncs.fetchHtmlAsText = async function fetchHtmlAsText(url,parent,uuid) {
    const response = await fetch(url);
    var div = document.createElement('div');
    div.type = 'div';
    div.innerHTML = await response.text();
    if(uuid != null)div = findAllElementsWithNonEmptyId(div, uuid)
    parent.appendChild(div)
    return parent;
  }
  
  function findAllElementsWithNonEmptyId(parent,id) {
    // This selector matches any element that has an ID attribute that is not empty
    elements = parent.querySelectorAll('[id]:not([id=""]):not([uuid])');
    for (let i = 0; i < elements.length; i++) {
        elements[i].setAttribute("uuid",id)
        elements[i].setAttribute("id",elements[i].getAttribute("id")+"-"+id)
      }
    return parent
}

GlobalFuncs.uuidv4 = function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
  }

  