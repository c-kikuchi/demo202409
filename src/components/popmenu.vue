<style scoped>
.popmenuwrapper {
  position:relative;
}
.popmenuopener {
	background-color: #0090ff;
	padding: 5px;
	display: inline-block;
	width: 20px;
	height: 20px;
	text-align: center;
	line-height: 20px;
	color: #fff;
}
.popmenu {
  position:absolute;
  left:0;
  right:auto;
  z-index:1;
  background-color:#fff;
  margin:0;
  padding:0;
  min-width:120px;
  box-shadow:#999 3px 3px 3px;
  border:rgb(170, 184, 204) solid 1px;
}
.popmenu.right {
  right:0;
  left:auto;
}
.popmenu > :slotted(li) {
  list-style-type:none;
  background-color:#eee;
  border-bottom:#333 solid 1px;
  padding:5px 15px;
  cursor:pointer;
  font-size:small;
}
.popmenu > :slotted(li):hover {
  background-color:#aadaff;
}
.popmenu > :slotted(li):last-child {
  border-bottom-style: none;
}
</style>
<template>
<div class="popmenuwrapper">
  <label class="popmenuopener">
    <input type="checkbox" v-model="showmenu" style="display:none;">…
  </label>
  <menu class="popmenu" v-show="showmenu" :class="{'right':right}">
    <slot />
  </menu>
</div>
</template>
<script setup>
import { ref } from "vue"
const props = defineProps({
  "right":{
    type:Boolean, 
    default:false
  }
})
const showmenu = ref(false);

document.addEventListener("click", e=>{
  if(!e.target.closest(".popmenuwrapper")){
    showmenu.value = false;
  }
})
</script>