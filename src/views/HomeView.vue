<style scoped>
main {
	max-width: 800px;
	margin: auto;
	padding: 20px 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
}
h1 {
  text-align: center;
}
h3 {
	color: #1F6480;
	text-align: center;
	border-bottom: solid 3px;
}
h3::before {
	content: "■";
	color: #DC2328;
}

.ii-nav {
  margin: 0 30px;
}
.ii-link {
  color: #333
}

.main_link {
	display: block;
	background-color: #1F6480;
	color: #fff;
	padding: 10px 30px;
	font-size: large;
	border-radius: 20px;
	margin: auto;
	width: fit-content;
  font-weight:bold;
}
ul.link-list {
  list-style-type:none;
  padding-left:0;
}
ul.link-list li{
  margin:8px;
}

</style>
<script setup>
import {RouterLink} from "vue-router"
import metalist from "../metalist.js"
</script>

<template>
  <main>
    <h1><img src="/ii-icon_256.png" style="width:64px; height:64px; vertical-align: bottom;">demo 20240907</h1>
    <nav>
      <h3>『井伊家史料 十五』索引型 IIIF Manifest(demo)</h3>
      <div style="text-align:center">
        <RouterLink to="/viewer/iike-15" class="main_link">プレビュー</RouterLink>
        <ul class="link-list">
          <li>
            <a href="https://c-kikuchi.github.io/iiif/iike-15/manifest.json" class="ii-link">Manifest (Presentation API v3)</a>
          </li>
          <li>
            <a href="https://mirador-annotations.vercel.app/?manifest=https://c-kikuchi.github.io/iiif/iike-15/manifest.json" class="ii-link" target="_blank">Mirador Viewerでの表示例</a>
            <br><small>（中村覚氏作成のビューワを利用）</small>
          </li>
          <li>
            <a href="https://dip.lab.hi.u-tokyo.ac.jp/v3/850/8500/08/0115/manifest.json" class="ii-link">『井伊家史料　十五巻』OCR結果のManifest</a><br>
            <small>（中村覚氏作成の<a href="https://dip-s.lab.hi.u-tokyo.ac.jp/" target="_blank">東京大学史料編纂所・史料集版面検索</a>より）</small>
          </li>
        </ul>
      </div>
    </nav>
  </main>
</template>
