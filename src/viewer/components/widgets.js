
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

const describing_keys = ["見出し語","読み","原文表記","肩書き","メモ","巻","頁","番号","枝番","備考"];

function simpleCommentingWidget(obj){
  const elm = document.createElement("div");
  obj.annotation.bodies.filter(body=>{
    if(body.purpose == "commenting" || body.purpose == "replying" || !body.purpose){
      elm.insertAdjacentHTML("beforeend",`<p>${body.value}</p>`);
    }
  })
  return elm;
}

function IDShowingWidget(obj){
  const elm = document.createElement("div");
  if(obj.annotation.id){
    const id = obj.annotation.id;

    const ipt = document.createElement("input");
    ipt.setAttribute("type", "text");
    ipt.readOnly = true;
    ipt.value = id;
    ipt.style.cssText= `
      width: 320px;
      background-color: inherit;
      color: #333;
      border: 1px solid #999;
    `;
    ipt.addEventListener("focus", e=>e.target.select());
    
    const btn = document.createElement("button");
    btn.setAttribute("type","button");
    btn.innerHTML ="📋";
    btn.title="Copy ID";
    btn.addEventListener("click", e=>{
      navigator.clipboard.writeText(id);
    })

    elm.append("ID: ", ipt, btn);
    elm.style.cssText = `
      font-size:small;
      color:#333;
      background-color:#ccc;
      padding-left:5px;
      line-height:1.8em;
    `
  }
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
    label_elm.style.cssText = option.labelCSS || `
      width:80px;
      background-color:#666;
      color:#fff;
      display:flex;
      justify-content:center;
      align-items:center;
    `;
    return label_elm;
  });
  const [input1, input2] = [options1, options2].map(option=>{
    const ipt = document.createElement("input");
    ipt.setAttribute("type", "text");
    ipt.value = option.value;
    ipt.className = "r6o-editable-text";
    ipt.style.backgroundColor = "rgba(0,0,255,0.1)";
    ipt.addEventListener("change", option.onChange);
    ipt.addEventListener("keyup", e=>e.key=="Delete"&&e.stopPropagation());
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
      label_elm.innerText = "文書番号を指定";
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

    const add_comment = function(e){
      if(current_body){
        obj.onUpdateBody(current_body, create_describing_body(label, e.target.value));
      }
      else{
        obj.onAppendBody(create_describing_body(label, e.target.value));
      }
    };
    
    
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
      label_elm.style.cssText = `
        width:80px;
        background-color:#666;
        color:#fff;
        display:flex;
        justify-content:center;
        align-items:center;
      `;

      const input_elm = document.createElement("textarea");
      input_elm.className = "r6o-editable-text";
      input_elm.rows = "1";
      input_elm.value = current_value;
      const textarea_default_height = function(el){
        el.style.height = "46px";
      };
      const textarea_auto_height = function(el){
        el.style.height = el.scrollHeight + "px"; 
      };
      input_elm.addEventListener("change", add_comment); 
      input_elm.addEventListener("input", e=>textarea_auto_height(e.target));
      input_elm.addEventListener("focus", e=>textarea_auto_height(e.target));
      input_elm.addEventListener("blur", e=>textarea_default_height(e.target));
      input_elm.addEventListener("keyup", e=>e.key=="Delete"&&e.stopPropagation());
      textarea_default_height(input_elm);


      const searcher_elm = document.createElement("div");
      searcher_elm.style.cssText = `
        width:30px;
        display:flex;
        justify-content:center;
        align-items:center;
      `;
      const searcher_btn = document.createElement("button");
      searcher_btn.setAttribute("type", "button");
      searcher_btn.innerHTML = "🔍&#xFE0E;";
      searcher_btn.title = "索引型で検索";
      searcher_btn.addEventListener("click", e=>{
        const search_word = input_elm.value;
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
    const add_comment = function(e, current_bodies, labels,j){
      //console.log("add_comment |", j, current_bodies, input_elms.map(el=>el.value), labels)
      const diffs = [];
      labels.forEach((label,i)=>{
        const current_body = current_bodies[i]
        if(current_body){
          diffs.push({
            action:"update",
            previous:current_body,
            updated:create_describing_body(label, input_elms[i].value)
          });
          //obj.onUpdateBody(current_body, create_describing_body(label, input_elms[i].value))
        }
        else{
          //console.log("create",i)
          diffs.push({
            action:"append",
            body:create_describing_body(label, input_elms[i].value)
          });
          //obj.onAppendBody(create_describing_body(label, input_elms[i].value));
        }
      });
      obj.onBatchModify(diffs);
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

    let reloadflag = false;
    const defaultValues = setDefaultValue(obj, current_bodies, current_values);
    if(defaultValues){
      defaultValues.forEach((v,i)=>current_values[i]=v);  
      reloadflag=true;    
    }

    //console.log("checking default values |", current_bodies, current_values, defaultValues)
    const inputoptions = labels.map((label,i)=>{
      return {
        label:label,
        value:current_values[i],
        onChange:e=>{add_comment(e, current_bodies, labels,i)}
      };
    })
    const twoInput = buildTwoInputContainer(...inputoptions);

    const container = twoInput.container;
    container.className = "r6o-widget comment editable ii-comment";
    const input_elms = [twoInput.input1, twoInput.input2];
    
    if(reloadflag){
      add_comment(null, current_bodies, labels);
    }
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
  container.style.cssText = `
    display:flex;
    flex-direction:row;
  `;
  const link_container = document.createElement("div");
  link_container.style.cssText =`
    flex-grow:1;
  `;
  const link_bodies = obj.annotation.bodies.filter(body=>body.purpose=="linking");
  link_bodies.forEach(link_body=>{
    if(link_body){
      const url = link_body.value;
      const link = document.createElement("a");
      link.href = url;
      link.target="_blank";
      if(url.match(/^https\:\/\/wwwap\.hi\.u\-tokyo\.ac\.jp\/ships\/w30/)){
        link.innerText="近世史編纂支援データベース";
      }
      else{
        link.innerText = url.slice(0, 30);
      }
      const btn = document.createElement("button");
      btn.innerText="Edit"
      btn.addEventListener("click",e=>{
        let new_url = prompt("input new url",url);
        if(new_url && new_url!=url){
          if((/^\d{8}$/).test(new_url)){
            new_url = `https://wwwap.hi.u-tokyo.ac.jp/ships/w30/detail/3001${new_url}?dispid=disp02&type=2`
          }
          obj.onUpdateBody(link_body,{
            "type": "TextualBody",
            "purpose": "linking",
            "value": new_url
          });
        }
      })
      const p = document.createElement("div");
      p.append("🔗",link,btn);
      p.style.fontSize="small";
      link_container.append(p);
    }
  })
  const append_btn = document.createElement("button");
  append_btn.innerText = "+";
  append_btn.addEventListener("click",e=>{
    let new_url = prompt("input new url");
    if(new_url){
      if((/^\d{8}$/).test(new_url)){
        new_url = `https://wwwap.hi.u-tokyo.ac.jp/ships/w30/detail/3001${new_url}?dispid=disp02&type=2`
      }
      obj.onAppendBody({
        "type": "TextualBody",
        "purpose": "linking",
        "value": new_url
      });
    }
  })
  container.append(link_container,append_btn);
  return container;
}

function apply_candidate(obj, cand, join_mode = false){
  const annot = obj.annotation.underlying;
  const diffs = [];
  describing_keys.forEach(key=>{
    const dat_value = cand.data[key];
    if(annot["_type"]=="describing" || obj.annotation.bodies.every(body=>body.purpose!="tagging")){
      const current_body = obj.annotation.bodies.find(body=>body.purpose=="describing"&&(new RegExp(`^${key}: `)).test(body.value));
      if(current_body){
        if(join_mode && ["巻","頁","番号","枝番"].every(k=>k!=key)){
          const label_exp = new RegExp(`^${key}: ([\\s\\S]*)$`);
          const current_value = current_body ? (label_exp.exec(current_body.value)?RegExp.$1:"") : "";
          const new_value = ((current_value&&current_value!=dat_value)?(current_value+ "・"):"")  + dat_value;
          diffs.push({
            action:"update",
            previous:current_body,
            updated:create_describing_body(key, new_value)
          });
        }
        else{
          diffs.push({
            action:"update",
            previous:current_body,
            updated:create_describing_body(key, dat_value)
          });
        }
      }
      else{
        diffs.push({
          action:"append",
          body:create_describing_body(key, dat_value)
        });
      }
    }
  });
  if(cand.data["DB-ID"]){
    const new_body = {
      "type": "TextualBody",
      "purpose": "linking",
      "value": `https://wwwap.hi.u-tokyo.ac.jp/ships/w30/detail/3001${cand.data["DB-ID"]}?dispid=disp02&type=2`
    };
    const link_body = obj.annotation.bodies.find(body=>body.purpose=="linking");
    if(link_body && !join_mode){
      diffs.push({
        action:"update",
        previous:link_body,
        updated:new_body
      })
    }
    else{
      diffs.push({
        action:"append",
        body:new_body
      });
    }
  }
  if(diffs.length>0){
    obj.onBatchModify(diffs);
  }
}
function join_candidate(obj, cand){
  apply_candidate(obj,cand,true);
}
function create_candidate(obj){
  const annot = obj.annotation.underlying;
  const cand = {
    title:"",
    data:{}
  }
  if(annot["_type"]=="describing" || obj.annotation.bodies.every(body=>body.purpose!="tagging")){
    describing_keys.forEach(key=>{
      const current_body = obj.annotation.bodies.find(body=>body.purpose=="describing"&&(new RegExp(`^${key}: `)).test(body.value));
      const label_exp = new RegExp(`^${key}: ([\\s\\S]*)$`);
      const current_value = current_body ? (label_exp.exec(current_body.value)?RegExp.$1:"") : "";
      cand.data[key] = current_value;
    });
    const link_body = obj.annotation.bodies.find(body=>body.purpose=="linking"&&(/https\:\/\/wwwap\.hi\.u\-tokyo\.ac\.jp\/ships\/w30\/detail\/3001(\d{8})\?dispid=disp02&type=2/).test(body.value));
    if(link_body){
      cand.data["DB-ID"] = RegExp.$1;
    }
  }
  return cand;
}

function candidateSelectorWidget(obj){
  const container = document.createElement("div");
  const annot = obj.annotation.underlying;
  if(annot["_candidate"] && annot["_candidate"].length>0){
    annot["_candidate"].forEach(cand=>{
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        display:flex;
        flex-direction:row;
      `;
      const details = document.createElement("details");
      details.style.fontSize = "small";
      const summary = document.createElement("summary");
      summary.innerText = cand.title;
      const list = document.createElement("ul");
      for(const [key, value] of Object.entries(cand.data)){
        //const key = v[0], value = v[1];
        const list_item = document.createElement("li");
        list_item.innerText = `${key}: ${value}`;
        list.append(list_item);
      };
      details.append(summary,list);

      const btn_wrapper = document.createElement("div");
      const apply_button = document.createElement("button");
      apply_button.setAttribute("type", "button");
      apply_button.innerText = "Apply";
      apply_button.addEventListener("click", ()=>{
        apply_candidate(obj, cand)
      });
      const join_button = document.createElement("button");
      join_button.setAttribute("type", "button");
      join_button.innerText ="Join";
      join_button.addEventListener("click",e=>{
        join_candidate(obj, cand);
      });
      const copy_btn = document.createElement("button");
      copy_btn.innerText = "◎";
      copy_btn.addEventListener("click", e=>{
        navigator.clipboard.writeText(JSON.stringify(cand));
      })
      btn_wrapper.append(apply_button,join_button,copy_btn);

      wrapper.append(details,btn_wrapper);
      container.append(wrapper);
    })
  }
  if(annot["_type"]=="describing" || obj.annotation.bodies.every(body=>body.purpose!="tagging")){
    const btnwrapper = document.createElement("div");
    btnwrapper.style.cssText = `text-align:right`;
    const paste_btn = document.createElement("button");
    paste_btn.innerText = "Paste Data";
    paste_btn.addEventListener("click",e=>{
      const text = prompt("input data json","");
      if(text){
        let json = JSON.parse(text);
        if(typeof json.title == "undefined"){
          json = {title:"",data:json};
        }
        apply_candidate(obj, json);
      }
    })
    const candcopy_btn = document.createElement("button");
    candcopy_btn.innerText = "Copy Data";
    candcopy_btn.addEventListener("click", e=>{
      const cand = create_candidate(obj);
      navigator.clipboard.writeText(JSON.stringify(cand));
    })
    btnwrapper.append(paste_btn, candcopy_btn);
    container.append(btnwrapper);
    }
  return container;
}


function IIWidgetsBuilder(bridge){
  return [
    IDShowingWidget,
    IIPageTaggingWidgetBuilder(bridge),
    LabeledCommentWidgetBuilder("見出し語",bridge),
    LabeledCommentWidgetBuilder("読み",bridge),
    LabeledCommentWidgetBuilder("原文表記",bridge),
    LabeledCommentWidgetBuilder("肩書き",bridge),
    LabeledCommentWidgetBuilder("メモ",bridge),
    LabeledCommentWidgetBuilder("備考",bridge),
    IIBangoWidgetBuilder(bridge),
    IIKanPageWidgetBuilder(bridge),
    IILinkingWidget,
    simpleCommentingWidget,
    candidateSelectorWidget
  ];
}

export default IIWidgetsBuilder
