import {createStore} from "vuex"

const store = createStore({
  state(){
    return {
      annotations:[],
      annotations_IDSet:new Set()
    }
  },
  mutations:{
    addAnnotation(state, annotation){
      state.annotations.push(annotation);
      state.annotations_IDSet.add(annotation.id);
    },
    updateAnnotation(state, payload){
      const {annotation, previous} = payload;
      const index = state.annotations.findIndex(item=>{
        return item.id == previous.id;
      });
      state.annotations[index] = annotation;
    },
    deleteAnnotation(state, annotation){
      const index = state.annotations.findIndex(item=>{
        return item.id == annotation.id;
      });
      state.annotations.splice(index,1);
    },
    addAnnotationByList(state, list){
      state.annotations.push(...list);
      list.forEach(annot=>{
        state.annotations_IDSet.add(annot.id);
      })
    },
    setAnnotations(state, list){
      const addlist = [];
      list.forEach(annot=>{
        if(!state.annotations_IDSet.has(annot.id)){
          state.annotations_IDSet.add(annot.id);
          addlist.push(annot);
        }
      });
      state.annotations.push(...addlist);
    }
  }
});

export default store