<template>
  <div style="width:300px;">
    <ol style="font-size:small;">
      <li v-for="index in currentIndex">
        {{index.date}} 
        <RouterLink :to="'/viewer/'+bookid+'/'+index.page">{{ index.title }}</RouterLink>
      </li>
    </ol>
  </div>
</template>
<script>
import metalist from "../metalist.js";
import {RouterLink} from "vue-router";

export default {
  props:["bookid"],
  //components:{RouterLink},
  data(){
    return {
      loadedIndexSet:new Set(),
      loadedIndex:{},
      currentIndex:[],
    }
  },
  computed:{
    currentMeta(){
      const currentid = this.bookid;
      return metalist.list.find(meta=>meta.bookid==currentid);
    },
    currentIndexPath(){
      console.log("index!")
      const path = this.currentMeta["index_json"]?(location.origin + this.currentMeta["index_json"]):"";
      if(this.loadedIndexSet.has(path)){
        this.currentIndex = this.loadedIndex[path];
      }
      else{
        this.currentIndex = [];
        fetch(path).then(resp=>resp.json()).then(json=>{
          this.loadedIndexSet.add(path);
          this.loadedIndex[path] = json;
          this.currentIndex = json;
        });
      }
    }
  },
  mounted(){
    this.currentIndexPath;
  }
}

</script>