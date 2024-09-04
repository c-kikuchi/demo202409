
const utils = {
  hasIntersectionXYWH(rect1, rect2){
    const x0 = rect1[0], y0 = rect1[1], w0 = rect1[2], h0 = rect1[3];
    const x1 = rect2[0], y1 = rect2[1], w1 = rect2[2], h1 = rect2[3];
    return (Math.max(x0,x1) <= Math.min(x0+w0, x1+w1)) && (Math.max(y0,y1) <= Math.min(y0+h0, y1+h1));
  },
  getXYWHFromTarget(target){
    const xywh_text = target.selector.value;
    let xywh = [0,0,0,0];
    xywh_text.replace(/^xywh=pixel:([\d\.]+),([\d\.]+),([\d\.]+),([\d\.]+)$/,(match,...ps)=>{
      xywh = ps.slice(0,4).map(p=>parseFloat(p));
    })
    return xywh;
  },
}

//const describing_keys = ["見出し語","読み","原文表記","肩書き","メモ","巻","頁","番号","枝番","備考"];
const describing_keys = ["見出し語","原文表記","肩書き","メモ","巻","頁","番号","枝番"];

function simpleCommentingWidget(obj){
  const elm = document.createElement("div");
  elm.style.cssText=`
    font-size:12px;
    line-height:1.2em;
    padding:5px;
  `;
  obj.annotation.bodies.filter(body=>{
    if(body.purpose == "commenting" || body.purpose == "replying" || !body.purpose){
      elm.insertAdjacentHTML("beforeend",`<p>${body.value}</p>`);
    }
  })
  return elm;
}

function buildTwoInputContainer(options1, options2){
  const container = document.createElement("div");
  container.style.cssText = `
    display:flex;
    flex-direction:row;
  `;  

  const [label1, label2] = [options1, options2].map(option=>{
    const label_elm = document.createElement("div");
    label_elm.innerText = option.label;
    if(option.labelCSS){
      label_elm.style.cssText = option.labelCSS;
    }
    else{
      label_elm.classList.add("iiwidget-label-elm");
    }
    return label_elm;
  });
  const [input1, input2] = [options1, options2].map(option=>{
    const ipt = document.createElement("div");
    //ipt.setAttribute("type", "text");
    ipt.innerText = option.value;
    //ipt.className = "r6o-editable-text";
    //ipt.style.backgroundColor = "rgba(0,0,255,0.1)";
    //ipt.addEventListener("change", option.onChange);
    //ipt.addEventListener("keyup", e=>e.key=="Delete"&&e.stopPropagation());
    ipt.classList.add("iiwidget-input-elm");
    return ipt;
  });

  container.append(label1, input1, label2, input2);

  return {container, input1, input2};

}

function IIPageTaggingWidgetBuilder(bridge){
  return function IIPageTaggingWidget(obj){
    //console.log(obj.annotation.underlying.id, obj.annotation.underlying._count);
    //obj.annotation.underlying._count = obj.annotation.underlying._count?obj.annotation.underlying._count+1:0;
    const annot = obj.annotation.underlying;
    const container = document.createElement("div");
    container.className = "r6o-widget comment editable";
    
    const tag_body = obj.annotation ? obj.annotation.bodies.find(body=>
      body.purpose == "tagging"
    ) : null;
    const has_tag = !!tag_body || annot["_type"] == "tagging";
    const tag_value = has_tag ? tag_body.value : "";
    const has_describing = !!obj.annotation &&
      obj.annotation.bodies.some(body=>body.purpose=="describing") || annot["_type"] == "describing";

    const tag_bango = has_tag ? (
        tag_body["_bango"] || tag_value.split("-")[0]
      ) : "";
    const tag_bango_eda = has_tag ? (
        tag_body["_bango_eda"] ||
        (/.+?\-(.+)/.test(tag_value) ? RegExp.$1 : "")
      ) : "";
    
    if(has_tag || (!has_describing && bridge.is_taggingmode) && annot["_type"]!="ocrtext"){
      if(annot["_type"] != "tagging"){
        obj.onSetProperty("_type", "tagging");
      }
      const create_body = function(bango, eda){
        const value = bango + (eda?("-"+eda):"");
        return {
          "type": "TextualBody",
          "motivation":"commenting",
          "purpose": "tagging",
          "value": value,
          "_bango": bango,
          "_bango_eda": eda,
        };
      };
      const add_tag = function(){
        const bango = input_elm.value;
        const eda = input_elm_eda.value;
        //if(tag_body){
          obj.onUpdateBody(tag_body, create_body(bango, eda));
        //}
        //else{
        //  obj.onAppendBody(create_body(bango, eda));
        //}
      }

      if(!has_tag){
        obj.onAppendBody(create_body(tag_bango,tag_bango_eda))
      }


      const label_elm = document.createElement("div");
      label_elm.innerText = "文書番号";
      label_elm.style.cssText = `
        background-color:#666;
        color:#fff;
      `;
      const labelCSS = `
      width:80px;
      display:flex;
      justify-content:center;
      align-items:center;`

      const twoInput = buildTwoInputContainer({
        label:"号:",
        labelCSS:labelCSS,
        value:tag_bango,
        onChange:add_tag,
      },{
        label:"枝:",
        labelCSS:labelCSS,
        value:tag_bango_eda,
        onChange:add_tag,
      })
      const input_elm = twoInput.input1, input_elm_eda = twoInput.input2;
      const input_container = twoInput.container;

      container.append(label_elm, input_container);
    }
    else{
      if(!annot["_type"]){
        obj.onSetProperty("_type", "describing");
      }
      container.style.display = "none";
    }
    return container;    
  };
}

function create_describing_body (label, value){
  const body = {
    "type": "TextualBody",
//    "motivation":"commenting",
    "purpose": "describing",
    "value": `${label}: ${value}`
  };
  //console.log("create body |", label, value, body);
  return body;
};

function LabeledCommentWidgetBuilder(_label, bridge){
  _label = _label || "見出し語";
  return function LabeledCommentWidget(obj){
    const container = document.createElement("div");
    const label = _label;
    const label_exp = new RegExp(`^${label}: ([\\s\\S]*)$`);
    //console.log("render", label);
    
    const annot = obj.annotation.underlying;

    const current_body = obj.annotation ? obj.annotation.bodies.find(body=>{
      return body.purpose == "describing" && label_exp.test(body.value);
    }) : null;
    const current_value = current_body ? (label_exp.exec(current_body.value)?RegExp.$1:"") : "";

    const has_tag = !!obj.annotation && obj.annotation.bodies.some(body=>body.purpose == "tagging");
    /*const has_describing =  !!obj.annotation &&
      obj.annotation.bodies.some(body=>body.purpose=="describing");*/

    
    
    container.className = "r6o-widget comment editable ii-comment";
    container.style.cssText = `
      display:flex;
      flex-direction:row;
    `;

    //if(has_tag || (!has_describing && bridge.is_taggingmode)){
    if(has_tag || annot["_type"] == "ocrtext"){
      container.style.display = "none";
      return container;
    }
    else{
      const label_elm = document.createElement("div");
      label_elm.innerText = label;
      label_elm.classList.add("iiwidget-label-elm");

      const input_elm = document.createElement("div");
      //input_elm.className = "r6o-editable-text";
      input_elm.innerText = current_value;
      input_elm.classList.add("iiwidget-input-elm");

      const searcher_elm = document.createElement("div");
      searcher_elm.classList.add("iiwidget-searcher-elm");

      const searcher_btn = document.createElement("button");
      searcher_btn.setAttribute("type", "button");
      searcher_btn.innerHTML = "🔍&#xFE0E;";
      searcher_btn.title = "索引型で検索: "+current_value;
      searcher_btn.addEventListener("click", e=>{
        const search_word = current_value;
        const search_url = "https://wwwap.hi.u-tokyo.ac.jp/ships/w30/search";
        const search_query = `?keyword=${search_word}&book=井伊家史料&searchtarget=索引型&expand=true&type=2&page=1&itemsperpage=200&sortby=title_word roll_page&sortdesc=false&sortitem=見出し語：昇順`;
        const url = search_url + encodeURI(search_query);
        window.open(url);
      });
      searcher_elm.append(searcher_btn);
      container.append(label_elm, input_elm, searcher_elm);
      
      return container;
    }
  }
}

function MultiInputCommentingWidgetBuilder(labels, setDefaultValue=function(obj,bodies,values){}, bridge){  
  labels = labels || ["番号", "枝番"];
  return function MultiInputCommentingWidget(obj){
    const has_tag = !!obj.annotation && obj.annotation.bodies.some(body=>body.purpose == "tagging");
    const annot = obj.annotation.underlying;
    //let has_describing = false;
    if(has_tag || annot["_type"]=="ocrtext"){
      const c = document.createElement("div");
      c.style.display = "none";
      return c;
    }


    //const labels = [label1, label2]
    const label_exps = labels.map(label=>new RegExp(`^${label}: ([\\s\\S]*)`));
    const current_bodies = [null,null];
    let current_values = ["",""];

    //console.log(obj.annotation.bodies);
    obj.annotation && obj.annotation.bodies.forEach(body=>{
      if(body.purpose == "describing"){
        //has_describing = true;
        label_exps.forEach((exp,i)=>{
          if(exp.test(body.value)){
            //console.log("body found!", body, RegExp.$1);
            current_bodies[i] = body;
            current_values[i] = RegExp.$1;
          }
        })
      }
    });
    const inputoptions = labels.map((label,i)=>{
      return {
        label:label,
        value:current_values[i]
      };
    })
    const twoInput = buildTwoInputContainer(...inputoptions);

    const container = twoInput.container;
    container.className = "r6o-widget comment editable ii-comment";
    return container;
  }

}

function IIBangoWidgetBuilder(bridge){
  const labels = ["番号", "枝番"];
  const setDefaultValue = function(obj, bodies, values){
    if(!values[0] && !values[1]){
      const target = obj.annotation.target;
      if(!target) return;
      const xywh = utils.getXYWHFromTarget(target);
      const current_annotations = bridge.currentAnnotations;
      const len = current_annotations.length;
      for(let i=0; i < len; i++){
        const annotation = current_annotations[i];
        const tag_body = annotation.body.length?annotation.body.find(body=>body.purpose == "tagging"):"";
        if(tag_body){
          const tag_xywh = utils.getXYWHFromTarget(annotation.target);
          if(utils.hasIntersectionXYWH(xywh, tag_xywh)){
            const tag_bango = tag_body["_bango"] || tag_body.value.split("-")[0];            
            const tag_bango_eda = tag_body["_bango_eda"] ||
              (/.+?\-(.+)/.test(tag_body.value) ? RegExp.$1 : "");
            return ([tag_bango, tag_bango_eda]);
          }
        }
      }
    }
  };
  return MultiInputCommentingWidgetBuilder(labels,setDefaultValue,bridge);
}

function IIKanPageWidgetBuilder(bridge){
  const labels = ["巻","頁"];
  const setDefaultValue = function(obj, bodies, values){    
    if(!values[0] && !values[1] && !bridge.is_taggingmode){
      const page = parseInt(bridge.currentPage, 10)+"";
      return [bridge.meta.volume, page];
    }
  }
  return MultiInputCommentingWidgetBuilder(labels,setDefaultValue,bridge);
}

function IILinkingWidget(obj){
  const container = document.createElement("div");
  container.classList.add("iiwidget-links-container");

  //const link_container = document.createElement("div");
  const link_bodies = obj.annotation.bodies.filter(body=>body.purpose=="linking");
  link_bodies.forEach(link_body=>{
    if(link_body){
      const url = link_body.value;
      const link = document.createElement("a");
      link.href = url;
      link.target="_blank";
      if(url.match(/^https\:\/\/wwwap\.hi\.u\-tokyo\.ac\.jp\/ships\/w30/)){
        link.innerText="近世史編纂支援DBへ";
      }
      else if(url.match(/^https\:\/\/wwwap\.hi\.u\-tokyo\.ac\.jp\/ships\/w03/)){
        link.innerText="維新史料綱要DBの関連項目を表示"
      }
      else if(url.match(/^https\:\/\/wwwap\.hi\.u\-tokyo\.ac\.jp\/ships\/w33/)){
        link.innerText="近世編年DBの関連項目を表示"
      }
      else{
        link.innerText = url.slice(0, 30);
      }
      
      const p = document.createElement("div");
      p.append("🔗",link);
      p.style.fontSize="small";
      //link_container.append(p);
      container.append(p);
    }
  })
  //container.append(link_container);
  return container;
}



function IIWidgetsBuilder(bridge){
  return [
    //IDShowingWidget,
    IIPageTaggingWidgetBuilder(bridge),
    LabeledCommentWidgetBuilder("見出し語",bridge),
    LabeledCommentWidgetBuilder("原文表記",bridge),
    LabeledCommentWidgetBuilder("肩書き",bridge),
    LabeledCommentWidgetBuilder("メモ",bridge),
    IIBangoWidgetBuilder(bridge),
    IIKanPageWidgetBuilder(bridge),
    IILinkingWidget,
    simpleCommentingWidget,
    //candidateSelectorWidget
  ].map(widget=>({widget:widget, force:"plainjs"}));
}

export default IIWidgetsBuilder
