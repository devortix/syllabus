import { createApp } from 'vue';
import Vant from 'vant';
import { Locale } from 'vant';
import enUS from 'vant/es/locale/lang/en-US';
import 'vant/lib/index.css';
import App from './App.vue';

const app = createApp(App);

app.use(Vant);
Locale.use('en-US', enUS);
app.mount('#app');
