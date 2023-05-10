import { createApp, h, watchEffect } from 'vue'
import { Repl, ReplStore } from '../src'
;(window as any).process = { env: {} }

import data from './files.json';
const mainFile = 'App.vue';
const demoFile = 'demo.vue';
const query = new URLSearchParams(location.search)
const store = new ReplStore({
  serializedState: location.hash.slice(1),
  showOutput: query.has('so'),
  outputMode: query.get('om') || 'preview',
  defaultVueRuntimeURL: import.meta.env.PROD
    ? undefined
    : `${location.origin}/src/vue-dev-proxy`,
  defaultVueServerRendererURL: import.meta.env.PROD
    ? undefined
    : `${location.origin}/src/vue-server-renderer-dev-proxy`
})
function resolveSFCExample (code: string) {
  const files = {
      [mainFile]: data.app,
      'space.vue': data.space,
      [demoFile]: code,
      'fes-design.js': fesDesignSetup,
      'import-map.json': JSON.stringify({
          imports: {
              '@fesjs/fes-design': 'https://npm.elemecdn.com/@fesjs/fes-design@latest/dist/fes-design.esm-browser.js',
              '@fesjs/fes-design/icon': 'https://npm.elemecdn.com/@fesjs/fes-design@latest/dist/fes-design.icon-browser.js'
          }
      })
  };
  return files;
}
function updateExample (code:string) {
  store.setFiles(resolveSFCExample(code), mainFile).then(() => {
      store.setActive(demoFile);
  });
}
const fesDesignSetup = `
        // 全局注册，引入需要的包
        import { getCurrentInstance } from 'vue';
        import Space from './space.vue';
        import FesDesign from '@fesjs/fes-design';
        import * as Icons from '@fesjs/fes-design/icon';
        export function loadStyle() {
          const hasLinks = document.querySelectorAll('link');
          for(let l of hasLinks) {
            if (/fes-design.min.css/.test(l.href)) return;
          }
        
          const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = 'https://npm.elemecdn.com/@fesjs/fes-design@latest/dist/fes-design.min.css';
            document.head.appendChild(link)
        }
        
        export function setupFesDesign() {
          loadStyle();
          const instance = getCurrentInstance()
          instance.appContext.app.use(FesDesign);
          Object.keys(Icons).forEach((iconName) => {
              instance.appContext.app.component(iconName, Icons[iconName]);
          });
          instance.appContext.app.component('Space', Space)
        }
        `;
const App = {
  setup() {
    

    watchEffect(() => history.replaceState({}, '', store.serialize()))

    setTimeout(() => {
      updateExample(`
      <template>
      <div class="investigation-page">
        <div class="search-section">
          <FForm :model="searchParams" layout="inline" :labelWidth="100">
            <FFormItem label="排查名称">
              <FInput v-model="searchParams.name" placeholder="请输入排查名称"></FInput>
            </FFormItem>
            <FFormItem label="监管文件名称">
              <FInput v-model="searchParams.file" placeholder="请输入监管文件名称"></FInput>
            </FFormItem>
            <FFormItem label="通知时间">
              <FDatePicker v-model="searchParams.time" placeholder="请选择通知时间"></FDatePicker>
            </FFormItem>
            <FFormItem label="排查状态">
              <FSelect v-model="searchParams.status" placeholder="请选择排查状态" :options="statusOptions"></FSelect>
            </FFormItem>
            <FFormItem>
              <FButton type="primary" @click="handleSearch">查询</FButton>
            </FFormItem>
          </FForm>
        </div>
    
        <div class="table-section">
          <FTable :data="investigations" @selectionChange="handleSelectionChange">
            <FTableColumn prop="id" label="序号"></FTableColumn>
            <FTableColumn prop="name" label="排查名称"></FTableColumn>
            <FTableColumn prop="file" label="对应监管文件名称"></FTableColumn>
            <FTableColumn prop="time" label="通知发送时间"></FTableColumn>
            <FTableColumn prop="deadline" label="反馈截止时间"></FTableColumn>
            <FTableColumn prop="status" label="排查状态"></FTableColumn>
            <FTableColumn prop="contact" label="消保联系人"></FTableColumn>
            <FTableColumn label="操作">
              <template v-slot="{row}">
                <FButton type="text">编辑</FButton>
                <FButton type="text">删除</FButton>
              </template>
            </FTableColumn>
          </FTable>
    
          <div class="pagination-container">
            <FPagination :total="totalRows" :current-page="currentPage" @page-change="handlePageChange" />
          </div>
        </div>
      </div>
    </template>
    
    <script>
    import { reactive, toRefs } from 'vue';
    // import { request } from '@fesjs/fes';
    export default {
      name: 'InvestigationPage',
      setup() {
        const searchParams = reactive({
          name: '',
          file: '',
          time: '',
          status: '',
          page: 1,
          size: 10,
        });
    
        const investigations = reactive([]);
    
        const totalRows = reactive(0);
    
        // 排查状态选项
        const statusOptions = [
          { label: '未开始', value: 'notStarted' },
          { label: '进行中', value: 'inProgress' },
          { label: '已完成', value: 'completed' },
        ];
    
        // 查询排查列表
        // const handleSearch = async () => {
        //   const { code, data } = await request.get('/investigation', searchParams);
    
        //   if (code === 200) {
        //     investigations.splice(0, investigations.length, ...data.investigations);
        //     totalRows.value = data.total;
        //   }
        // };
    
        // 翻页
        const handlePageChange = (page) => {
          searchParams.page = page;
          // handleSearch();
        };
    
        // 表格选择状态变化
        const handleSelectionChange = (selection) => {
          console.log(selection);
        };
    
        return {
          searchParams,
          investigations,
          totalRows,
          statusOptions,
          // handleSearch,
          handlePageChange,
          handleSelectionChange,
        };
      },
    };
    </script>
    
    <style scoped>
    .investigation-page {
      margin: 20px;
    }
    
    .search-section {
      margin-bottom: 20px;
    }
    
    .table-section {
      position: relative;
    }
    
    .pagination-container {
      position: absolute;
      bottom: -40px;
      right: 0;
    }
    </style>
    `);
    }, 1000);

    // store.setVueVersion('3.2.8')

    return () =>
      h(Repl, {
        store,
        // layout: 'vertical',
        ssr: false,
        sfcOptions: {
          script: {
            // inlineTemplate: false
          }
        }
        // showCompileOutput: false,
        // showImportMap: false
      })
  }
}

createApp(App).mount('#app')
