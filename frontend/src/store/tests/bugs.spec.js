import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

import { addBug, getUnresolvedBugs, resolveBug, assignBugToUSer, loadBugs } from '../bugs'
import configureStore from '../configureStore';

describe('bugsSlice', () => {
  let fakeAxios;
  let store;

  beforeEach(() => {
    fakeAxios = new MockAdapter(axios);
    store = configureStore();
  });

  const bugsSlice = () => store.getState().entities.bugs

  const createState = () => ({
    entities: {
      bugs: {
        list: []
      }
    }
  })

  it('should add the bug to the store if its saved to the server', async() => {
    //Arrange
    const bug = { description: 'a' };
    const savedBug = { ...bug, id: 1 };
    fakeAxios.onPost('/bugs').reply(200, savedBug);

    //Act
    await store.dispatch(addBug(bug));

    //Assert
    expect(bugsSlice().list).toContainEqual(savedBug);
  });

  it('should not add the bug to the store if its not saved to the server', async() => {
    const bug = { description: 'a' };
    fakeAxios.onPost('/bugs').reply(500);
    
    await store.dispatch(addBug(bug));

    expect(bugsSlice().list).toHaveLength(0);
  });

  it('should resolve a bug and update store if bug is valid', async() => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(200, { id: 1, resolved: true });

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).toBe(true);
  });

  it('should not resolve a bug and not update store if bug is invalid', async() => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(500);

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).not.toBe(true);
  });

  it('should assign a bug to a user if valid', async() => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(200, { id: 1, userId: 1 });

    await store.dispatch(addBug({}));
    await store.dispatch(assignBugToUSer(1, 1));

    expect(bugsSlice().list[0].userId).toBe(1);
  });

  it('should not assign a bug to a user if not valid', async() => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(500);

    await store.dispatch(addBug({}));
    await store.dispatch(assignBugToUSer(1, 1));

    expect(bugsSlice().list[0].userId).not.toBe(1);
  });

  describe('loadingBugs', () => {
    describe('if the bugs exist in the cache', () => {
      it('should not be fetched from the server again', async() => {
        fakeAxios.onGet('/bugs').reply(200, [{id: 1}]);

        await store.dispatch(loadBugs());
        await store.dispatch(loadBugs());

        expect(fakeAxios.history.get.length).toBe(1);
      });


    });
    describe('if the bugs not exist in the cache', () => {
      it('they should be fetched from the server and put in the store', async() => {
        fakeAxios.onGet('/bugs').reply(200, [{id: 1}]);

        await store.dispatch(loadBugs());

        expect(bugsSlice().list).toHaveLength(1);
      });

      describe('loading indicator', () => {
        it('should be true while fetching the bugs', () => {
          fakeAxios.onGet('/bugs').reply(() => {
            expect(bugsSlice().loading).toBe(true);

            return [200, [{id: 1}]];
          });

          store.dispatch(loadBugs());
        });
        it('should be false after bugs are fetch', async () => {
          fakeAxios.onGet('/bugs').reply(200, [{id: 1}]);

          await store.dispatch(loadBugs());

          expect(bugsSlice().loading).toBe(false);
        });
        it('should be false if the server return an error', async () => {
          fakeAxios.onGet('/bugs').reply(500);

          await store.dispatch(loadBugs());

          expect(bugsSlice().loading).toBe(false);
        });
      });
    });
  });

  describe('selectors', () => {
    it('should return a list of unresolved bugs', async() => {
      const state = createState();
      state.entities.bugs.list = [
        { id: 1, resolved: true },
        { id: 2 },
        { id: 3 },
      ];

      const result = getUnresolvedBugs(state);

      expect(result).toHaveLength(2);
    });
  });
});