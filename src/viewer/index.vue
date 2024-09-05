<style>
body {
  margin:0;
}

.ii-root {
  display:flex;
  flex-direction: row;
  position:fixed;
  inset:0;
}
.ii-main-pane {
  flex-grow:1;
  display:flex;
  flex-direction: column;
  height:100vh;
}
.ii-side-pane {
  display:none;
}
.ii-side-pane.show {
  display: flex;
  flex-direction: column;
  min-width:350px;
}

@media screen and (max-width:480px) {
  .ii-side-pane.show{
    position:fixed;
    inset:0;
    width:100vw;
  }
}

.ii-header .side-menu{
  display:flex;
  height:100%;
  align-items:center;
}


.ii-toolbar {
  background-color:#0B8BEE;
  height:30px;
}
.ii-toolbar-controls{
  display:flex;
  flex-direction: row;
  justify-content: center;
  align-items:center;
  height:100%;
  gap:18px;
}
@media screen and (max-width:360px) {
  .ii-toolbar{
    height:90px;
  }
  .ii-toolbar-controls{
    flex-direction: column;
    gap:3px;
  }
}

.ii-toolbar-controls button{
  background-color:#0B8BEE;
  border: solid 1px #ccc;
  border-radius:3px;
  color:#fff;
  padding:3px;
  font-size:small;
}
.ii-toolbar-controls button:hover{
  background-color:#309aeb;
}
.ii-toolbar-controls button:active{
  background-color:#0771c2;
}
.ii-toolbar-controls button:disabled{
  background-color:rgb(134, 171, 196);
  color:#666;
}

.ii-zoom-control button{
  width:22px;
  height:22px;
}

.ii-image-viewer {
	width: 100%;
	min-height: 800px;
	background-color: rgb(204, 204, 204);
	position: relative;
	flex-grow: 1;
}

label{
  cursor:pointer;
}
input[type=checkbox].togglebutton {
  display:none;
}
input[type=checkbox].togglebutton+span {
  font-size:small;
  border: solid 1px #ccc;
  border-radius:3px;
  color:#fff;
  margin-left:5px;
  padding:3px;

}
input[type=checkbox]:not(:checked).togglebutton+span {
  background-color:#0B8BEE;
}
input[type=checkbox]:not(:checked).togglebutton+span:hover {
  background-color:#309aeb;
}
input[type=checkbox]:checked.togglebutton+span {
  background-color:#0771c2;
  border-style:inset;
}

</style>
<template>
<main class="ii-root">
<div class="ii-main-pane">
  <div class="ii-header">
    <div class="side-menu" style="float:left"><RouterLink to="/" style="color:#333;"><strong>&lt;Home</strong></RouterLink></div>
    <div class="side-menu" style="float:right;padding-right:10px;">
      <label role="button" aria-role="button" v-show="!is_sidepane_shown"><input type="checkbox" v-model="is_sidepane_shown" class="togglebutton"><span>三</span></label>
    </div>
    <!--<div style="float:right;">
      <details>
        <summary><strong>…</strong></summary>
        <div v-for="item in metalist.list">
          <RouterLink :to="'/viewer/'+item.bookid">{{ item.title }}</RouterLink>
        </div>
      </details>
    </div>-->
    <h1 style="text-align:center;font-size:large">{{ meta.title }}</h1>
  </div>
  <div ref="toolbar_elm" class="ii-toolbar">
    <div class="ii-toolbar-controls">
      <div class="ii-zoom-control">
        <button ref="zoominbutton" title="zoom in">+</button>
        <button ref="zoomoutbutton" title="zoom out">-</button>
        <button ref="homebutton" title="reset zoom">🏠&#xFE0E;</button>
        <button ref="fullpagebutton" title="full screen">⛶</button>
      </div>
      <div class="ii-page-control">
        <button :disabled="!this.nextPage" @click="this.currentPage=this.nextPage;setPage()">next</button>
        <select v-model="currentPage" @change="setPage()">
          <option v-for="jsonurl in meta.pages">{{jsonurl}}</option>
        </select>
        <button :disabled="!this.prevPage" @click="this.currentPage=this.prevPage;setPage()">prev</button>
      </div>
      <!--<div class="ii-tag-control">
        <label role="button" aria-role="button"><input class="togglebutton" type="checkbox" v-model="is_annotating" @change="startAnnotationMode()"><span>⌖索引の作成</span></label>
        <label role="button" aria-role="button"><input class="togglebutton" type="checkbox" v-model="is_taggingmode" @change="startTagAnnotationMode()"><span>文書番号指定</span></label>
      </div>-->
      <div>
        <label>
          <input type="checkbox" v-model="show_ocrs" @change="demo_show_ocr()">
          <span style="color:#fff;font-size:small;">OCR結果を表示</span>
        </label>
      </div>
    </div>
  </div>
  <div class="ii-image-viewer" ref="osd_elm"></div>
  <div style="display:none;">
    <!--<div>
      {{ currentPageUrl }}<br>
      {{ currentImageUrl }}
    </div>-->
    <div>
      <button @click="exportAnnotationToJSON">Export JSON</button>
      <button @click="exportManifest">Export Manifest</button>
      <button @click="openManifest">Show Manifest</button>
      <input type="file" @change="loadAnnotationFromJSON">
      <!--<button @click="getPageDimension">page size</button>-->
      <button @click="demo_openDefault">(DEMO)load demo json</button>
    </div>
  </div>
  <div style="display:none;">
    <div>Annotations: {{this.annotations.length}} (in this page: {{this.currentAnnotations.length}})</div>
    <!--<div v-for="anno in annotations" :key="anno.id">
      <details>
        <summary>{{anno.id}}</summary>
        <pre>{{JSON.stringify(anno, null, 2)}}</pre>
      </details>
    </div>-->
  </div>
</div>
<div class="ii-side-pane" :class="{show:is_sidepane_shown}" style="border-left:1px solid #666">
  <div style="background-color:#0B8BEE;height:40px;color:#fff;padding-top:5px;">
    <label role="button" aria-role="button"><input type="checkbox" v-model="is_sidepane_shown" class="togglebutton"><span>Close</span></label>
  </div>
  <div style="background-color:#fff;overflow-y:scroll;flex-grow:1"></div>
</div>
</main>
</template>
<script>
  import "./components/annotorious.min.css";
  import "./components/formatter.css";
  import "./components/widgets.css";
  import OpenSeadragon from "openseadragon";
  import OSDAnnotorious from './components/openseadragon-annotorious.min.js';
  import widgetBuilder from "./components/widgets.js";
  import formatterBuilder from "./components/formatter.js";
  import manifestGenerator from "./components/generateManifest.js";
  import metalist from "../metalist.js";
  import popmenu from "../components/popmenu.vue";
  import {RouterLink} from "vue-router";

  export default {
    components:{
      popmenu
    },
    data(){
      return {
        is_taggingmode:false,
        is_annotating:false,
        is_internal_routing:false,
        is_sidepane_shown:false,
        currentPage:"",
        viewer:null,
        anno:null,
        metalist:metalist,
        show_ocrs:false,
      };
    },
    computed:{
      nextPage(){
        const pages = this.meta.pages;
        const nextIndex = pages.indexOf(this.currentPage)+1;
        return (nextIndex!=0 && nextIndex<pages.length)?pages[nextIndex]:"";
      },
      prevPage(){
        const pages = this.meta.pages;
        const prevIndex = pages.indexOf(this.currentPage)-1;
        return (prevIndex>=0)?pages[prevIndex]:"";
      },
      bookid(){
        return this.$route.params.bookid;
      },
      routerpage(){
        return this.$route.params.page;
      },
      meta(){
        const currentid = this.bookid;
        const meta = metalist.list.find(meta=>meta.bookid==currentid);
        if(!this.currentPage){
          this.currentPage = meta.pages[0];
        }
        return meta;
      },
      annotations(){
        console.log("a");
        return !this.show_ocrs?
          this.$store.state.annotations:
          this.$store.state.annotations.concat(this.$store.state.ocrs);
      },
      jsonUrlRoot(){
        return this.meta.jsonUrl.server+this.meta.jsonUrl.prefix+this.meta.identifier+this.meta.jsonUrl.suffix;
      },
      imageUrlBase(){
        return this.meta.imageUrl.server+this.meta.imageUrl.prefix;
      },
      imageUrlRoot(){
        return this.imageUrlBase+this.meta.identifier+this.meta.imageUrl.suffix;
      },
      currentImageUrl(){
        return this.imageUrlRoot + this.currentPage + this.meta.imageUrl.extension;
      },
      currentPageUrl(){
        return this.jsonUrlRoot + this.currentPage + this.meta.jsonUrl.extension;
        //return this.meta.jsonUrlTemplate.replace(/{identifier}/,this.meta.identifier).repalce(/{page}/,this.)
      },
      currentAnnotations(){
        //console.log(this.currentPageUrl);
        //console.log("c")
        return this.annotations.filter(annotation=>{
          return (new RegExp("^"+this.currentImageUrl)).test(annotation.target.source);
        });
      }
    },
    methods:{
      exportAnnotationToJSON(){
        if(this.annotations.length<=0){
          return;
        }
        const blob = new Blob([JSON.stringify(this.annotations)], {type:"application/json"})
        const link = document.createElement("a");
        link.download = `annotation-${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(blob);
      },
      generateManifest(){
        if(this.annotations.length<=0){
          return;
        }
        const manifest = manifestGenerator({
          annotations:this.annotations,
          bookid:this.bookid,
          iiifserver:"https://c-kikuchi.github.io/",
          iiifprefix:"iiif/"
        });
        return manifest
      },
      exportManifest(){
        const manifest = this.generateManifest();
        if(!manifest) return;
        const blob = new Blob([JSON.stringify(manifest,null,2)], {type:"application/json"});
        const link = document.createElement("a");
        link.download = `manifest-${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(blob);
      },
      openManifest(){
        const manifest = this.generateManifest();
        if(!manifest) return;
        const blob = new Blob([JSON.stringify(manifest,null,2)], {type:"application/json"});
        window.open(URL.createObjectURL(blob));
      },
      async loadAnnotationFromJSON(e){
        const file = e.target.files[0];
        const text = await file.text();
        const annotations = JSON.parse(text);
        if(annotations.length>0 /*&& confirm("Overwrite Annotations?")*/){
          //this.annotations = annotations;
          this.$store.commit("setAnnotations", annotations);
          this.setPage();
        }
      },
      async openViewer(){
        const url = this.currentPageUrl;
        const json = await fetch(url).then(resp=>resp.json());
        const tilesource = json.data?json.data:json;
        this.viewer.open(tilesource);
      },
      setPage(){
        this.openViewer();
        this.is_internal_routing = true;
        this.$router.replace({path:`/viewer/${this.bookid}/${this.currentPage}`});
        this.anno.setAnnotations(this.currentAnnotations);
      },
      gotoPage(page){
        this.currentPage = page;
        this.setPage();
      },
      getIdentifierFromAnnotation(annotation){
        return (new RegExp(`^${this.imageUrlBase}(.+?)${this.meta.imageUrl.suffix}`))
          .test(annotation.target.source)?RegExp.$1:"";
      },
      getPageFromAnnotation(annotation){
        return (new RegExp(`^${this.imageUrlRoot}(.+?)${this.meta.imageUrl.extension}`))
          .test(annotation.target.source)?RegExp.$1:"";
      },
      insertIdentifierAndPage(annotation){
        if(!annotation["_identifier"]){
          annotation["_identifier"] = this.meta.identifier;
        }
        if(!annotation["_page"]){
          //const page = this.getPageFromAnnotation(annotation);
          annotation["_page"] = this.currentPage;
        }
        if(!annotation["_bookid"]){
          annotation["_bookid"] = this.meta.bookid;
        }
        if(!(new RegExp(`^${this.meta.imageUrlBase}`)).test(annotation.target.source)){
          annotation.target.source = this.currentImageUrl;
        }
      },
      addAnnotation(annotation){
        this.insertIdentifierAndPage(annotation);
        this.$store.commit("addAnnotation", annotation);
      },
      updateAnnotation(annotation, previous){
        //console.log(annotation, previous);
        this.insertIdentifierAndPage(annotation);
        this.$store.commit("updateAnnotation", {annotation, previous});
      },
      deleteAnnotation(annotation){
        this.$store.commit("deleteAnnotation", annotation);
      },
      startAnnotationMode(){
        if(this.is_annotating) this.anno.setDrawingEnabled(true);
      },
      startTagAnnotationMode(){
        if(this.is_taggingmode){
          //this.is_annotating = true;
          this.anno.setDrawingEnabled(true);
        }
      },
      getPageDimension(){
        const dimensions = this.viewer.source.dimensions;
        //const viewport_content = this.viewer.world.getItemAt(0).getContent();
        console.log("dimensions |", dimensions.x, dimensions.y);
        //console.log("viewport |", viewport_content.x, viewport_content.y);
      },
      async demo_openDefault(){
        const annotations = await fetch("/iike/default.json").then(resp=>resp.json());
        app.$store.commit("setAnnotations", annotations);
        this.setPage();
        console.log("default loaded");
      },
      async demo_show_ocr(){
        if(this.show_ocrs){
          //const ocr_annots = await fetch(location.origin+"/demo202409/json/0115_manfest-mod_all.json").then(resp=>resp.json());
          //this.$store.commit("setOcrs", ocr_annots);
          if(this.meta["ocr_json"]){
            this.$store.dispatch("loadOCR", location.origin + this.meta["ocr_json"]).then(r=>{
              this.setPage();
            });
          }
        }
      }
    },
    watch:{
      $route(to,from){
        //console.log(to,from);
        if(this.is_internal_routing){
          this.is_internal_routing = false;
          //console.log("internal");
          return;
        }
        if(to.params.page != from.params.page){
          this.currentPage = to.params.page;
        }
        if(to.params.bookid != from.params.bookid){
          console.log("change book");
          if(this.meta["annotation_json"]){
            this.$store.dispatch("loadJSON", location.origin + this.meta["annotation_json"]).then(r=>{
              this.setPage();
            });
          }
          this.currentPage = to.params.page||this.meta.pages[0];
        }
        this.setPage();
      }
    },
    async mounted(){
      const app = this;
      const bridge = {
        get is_taggingmode(){
          return app.is_taggingmode;
        },
        get currentAnnotations(){
          return app.currentAnnotations;
        },
        get meta(){
          return app.meta;
        },
        get currentPage(){
          return app.currentPage;
        }
      };

      if(this.routerpage){
        this.currentPage = this.routerpage;
      }

      this.viewer = OpenSeadragon({
        element:this.$refs.osd_elm,
        zoomInButton: this.$refs.zoominbutton,
        zoomOutButton: this.$refs.zoomoutbutton,
        homeButton: this.$refs.homebutton,
        fullPageButton: this.$refs.fullpagebutton,
        toolbar:this.$refs.toolbar_elm,
      });
      const anno = OSDAnnotorious(this.viewer,{
        widgets:widgetBuilder(bridge),
        formatter:formatterBuilder(bridge)
      });
      anno.readOnly = true;
      anno.on("createSelection", selection=>{
        console.log(selection);
      })
      anno.on("createAnnotation", annotation=>{
        this.addAnnotation(annotation);
        this.is_annotating = false;
        this.is_taggingmode = false;
      });
      anno.on("updateAnnotation", (annotation,previous)=>{
        this.updateAnnotation(annotation, previous);
      });
      anno.on("deleteAnnotation", annotation=>{
        this.deleteAnnotation(annotation);
        console.log("delete annotation")
      })
      anno.on("cancelSelected", ()=>{
        this.is_annotating = false;
        this.is_taggingmode = false;
      });
      
      this.anno = anno;
      if(this.meta["annotation_json"]){
        this.$store.dispatch("loadJSON", location.origin + this.meta["annotation_json"]).then(r=>{
          this.setPage();
        });
      }
      this.setPage();
      //window.app = this;

      //this.demo_openDefault();
    }
  };

</script>