import LoginPage from './loginPage';
import Button from '../components/button';
import rootScope from '../lib/rootScope';
import {attachClickEvent} from '../helpers/dom/clickEvent';

let page: LoginPage;

const mount = () => {
  if(!page) {
    page = new LoginPage({
      className: 'page-groupSelect',
      withInputWrapper: true,
      titleLangKey: 'GroupSelectTitle',
      subtitleLangKey: 'GroupSelectSubtitle'
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search groups';
    searchInput.className = 'input-field';

    const searchList = document.createElement('select');
    searchList.size = 5;
    searchList.style.display = 'none';

    const groupInput = document.createElement('input');
    groupInput.type = 'text';
    groupInput.placeholder = 'Group ID';
    groupInput.className = 'input-field';

    searchInput.addEventListener('input', async() => {
      const q = searchInput.value.trim();
      if(!q) {
        searchList.innerHTML = '';
        searchList.style.display = 'none';
        return;
      }
      const res: any = await rootScope.managers.apiManager.invokeApi('contacts.search', {q, limit: 5});
      searchList.innerHTML = '';
      const chats: any[] = res.chats || [];
      chats.forEach((chat: any) => {
        if(chat._ === 'chat' || chat._ === 'channel') {
          const opt = document.createElement('option');
          opt.value = '' + chat.id;
          opt.textContent = chat.title;
          searchList.append(opt);
        }
      });
      searchList.style.display = searchList.children.length ? '' : 'none';
    });

    searchList.addEventListener('change', () => {
      groupInput.value = searchList.value;
    });

    const btn = Button('btn-primary btn-color-primary', {text: 'Continue'});
    attachClickEvent(btn, () => {
      sessionStorage.setItem('selectedGroupId', groupInput.value);
      import('./pageIm').then((m) => m.default.mount());
    });

    page.inputWrapper.append(searchInput, searchList, groupInput, btn);
  }

  page.element.style.display = '';
};

export default {mount};
