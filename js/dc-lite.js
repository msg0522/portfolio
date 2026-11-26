/* Tiny runtime for the portfolio pages: renders a template from a component's renderVals() and keeps the DOM in sync. */
(function(){
  var esc=function(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var get=function(scope,path){return path.split('.').reduce(function(o,k){return o==null?o:o[k];},scope);};
  function expand(tpl,scope,H){
    var out='',i=0;
    while(true){
      var a=tpl.indexOf('<sc-for',i),b=tpl.indexOf('<sc-if',i);
      var n=[a,b].filter(function(x){return x>=0;});
      if(!n.length){out+=fill(tpl.slice(i),scope,H);break;}
      var p=Math.min.apply(null,n);out+=fill(tpl.slice(i,p),scope,H);
      var tag=tpl.indexOf('<sc-for',p)===p?'sc-for':'sc-if';
      var oe=tpl.indexOf('>',p),open=tpl.slice(p,oe+1),depth=1,j=oe+1;
      while(depth){var o=tpl.indexOf('<'+tag,j),c=tpl.indexOf('</'+tag+'>',j);if(o>=0&&o<c){depth++;j=o+1;}else{depth--;j=c+tag.length+3;}}
      var content=tpl.slice(oe+1,j-tag.length-3);
      if(tag==='sc-for'){var list=get(scope,open.match(/list="\{\{\s*([\w.]+)\s*\}\}"/)[1])||[];var as=open.match(/as="(.*?)"/)[1];
        for(var k=0;k<list.length;k++){var s=Object.assign({},scope);s[as]=list[k];out+=expand(content,s,H);}}
      else{if(get(scope,open.match(/value="\{\{\s*([\w.]+)\s*\}\}"/)[1]))out+=expand(content,scope,H);}
      i=j;
    }
    return out;
  }
  function fill(t,scope,H){
    t=t.replace(/\son([A-Z][a-z]+)="\{\{\s*([\w.]+)\s*\}\}"/g,function(m,ev,k){var f=get(scope,k);if(typeof f!=='function')return '';H.push(f);return ' data-on-'+ev.toLowerCase()+'="'+(H.length-1)+'"';});
    return t.replace(/\{\{\s*([\w.]+)\s*\}\}/g,function(m,k){var v=get(scope,k);return (v==null||typeof v==='function')?'':esc(v);});
  }
  window.DCLogic=function DCLogic(props){this.props=props||{};this.state={};};
  window.DCLogic.prototype.setState=function(o,cb){var self=this;Object.assign(this.state,typeof o==='function'?o(this.state):o);if(cb)(this._cbs=this._cbs||[]).push(cb);if(this._render&&!this._pending){this._pending=true;requestAnimationFrame(function(){self._pending=false;self._render();var c=self._cbs||[];self._cbs=[];c.forEach(function(f){f();});});}};
  window.dcMount=function(Component){
    var tpl=document.getElementById('dc-template').textContent;
    var root=document.getElementById('dc-root');
    var comp=new Component({});var H=[];
    comp._render=function(){H=[];var html=expand(tpl,comp.renderVals(),H);var next=document.createElement('div');next.id='dc-root';next.innerHTML=html;
      morphdom(root,next,{onBeforeElUpdated:function(from,to){if(from.classList&&from.classList.contains('drag')){to.style.translate=from.style.translate;if(from.classList.contains('dragging'))to.classList.add('dragging');}return !from.isEqualNode(to);}});};
    comp._render();
    document.addEventListener('click',function(e){var el=e.target,stopped=false;var ev={nativeEvent:e,target:e.target,currentTarget:null,preventDefault:function(){e.preventDefault();},stopPropagation:function(){stopped=true;}};
      while(el&&el!==document){if(el.getAttribute&&el.hasAttribute('data-on-click')){var f=H[+el.getAttribute('data-on-click')];ev.currentTarget=el;if(f)f(ev);if(stopped)break;}el=el.parentNode;}});
    if(comp.componentDidMount)comp.componentDidMount();
  };
})();
