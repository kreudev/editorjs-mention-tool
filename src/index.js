
import { create } from './utils';
 
const keysEnum = {
   '@': {
       createTextNode: (user)=> `@${user}`,
       textNodeClassName: "mention_tool_at"
   },
   '$': {
       createTextNode: (user)=> "${"+ user + "}",
       textNodeClassName: "mention_tool_dollar"
   }
}

/**
 * User Mention Primary API class
 */
export default class MentionTool {
       constructor({
           holder,
           allUsers,
           baseUrl,
           accessKey = "@",
           searchAPIUrl
       }) {
           /*
            * Property to hold holder.
            */
           this.holder = holder;
   
           /**
            * Property which holds all users data.
            */
           this.allUsers = allUsers;
   
           /**
            * Property whihc holds the base URL to fetch user profiles.
            */
           this.baseUrl = baseUrl;
   
           /**
            * Property which stores the base url
            */
           this.searchAPIUrl = searchAPIUrl;

           /**
            * Property which stores the base url
            */
           this.accessKey = accessKey;
   
           /**
            * Property which stores all the users data in a JSON object with userId as the key.
            */
           this.allUserListItemsCache = this.cacheAllUsersAsUserListItems(this.allUsers, this.baseUrl, this.accessKey);
   
           /**
            * Property which holds all user list items in order
            */
           this.initialUserlistItemsOrder = this.createAllUserListItems(this.allUsers, this.baseUrl, this.accessKey);
   
           /**
            * Property which holds previous active element
            * for inserting the user mention link once user selects the required option.
            */
           this.prevActiveElement = null;
           this.prevCaretPosAndSelectedNode = {};
   
           /**
            * Creates ans stores users list and user mention toolbar container.
            */
           this.nodes = {
               usersList: this.createUsersList(this.initialUserlistItemsOrder),
               searchBar: this.createSearchbar(this.accessKey, this.allUsers),
               userMentionToolbar: null
           }
   
           /**
            * Creates main user mention toolbar component.
            */
           this.nodes.userMentionToolbar = this.createUserMentionToolbar(this.nodes.searchBar, this.nodes.usersList);
   
           /**
            * Appends user mention toolbar to document. 
            */
           document.body.appendChild(this.nodes.userMentionToolbar)
   
           /**
            * Hides the user mention toolbar and changes the focus to previously focused input.
            */
           this.hideUserMentionToolbarAndChangeFocus(this.holder, this.accessKey);
   
           /**
            * Main class object.
            */
           const classObj = this;
   
           /**
            * Hides user mention toolbar on page scroll
            */
           window.addEventListener('scroll', function () {
               classObj.hideUserMentionToolbar();
           });
       }

    /**
     * CSS Styles
     */
    get CSS() {
        return {
            /**
             * User Mention Toolbar related styles.
             */
            userMentionToolbar: 'user-mention-toolbar',
            userMentionToolbarShowed: 'user-mention-toolbar--showed',
            userMentionToolbarLeftOriented: 'user-mention-toolbar--left-oriented',
            userMentionToolbarLeftOrientedShowed: 'user-mention-toolbar--left-oriented--showed',
            userMentionToolbarRightOriented: 'user-mention-toolbar--right-oriented',
            userMentionToolbarRightOrientedShowed: 'user-mention-toolbar--right-oriented--showed',
            userMentionToolbarShortcut: 'user-mention-toolbar__shortcut',
            /**
             * Search bar styles
             */
            searchBar: 'user-mention-search-bar',
            searchIcon: 'search-icon',
            searchTextbox: 'search-textbox',
            /**
             * User list styles
             */
            usersListWrapper: 'users-list-wrapper',
            /**
             * User list item styles
             */
            userListItemWrapper: 'user-list-item-wrapper',
            userProfileContainer: 'user-profile-container',
            userNameInitial: 'user-name-initial',
            imageAvatar: 'user-image-avatar',
            userMetadataContainer: 'user-metadata-container',
            userFullName: 'user-full-name',
            userSlug: 'user-slug'
        };
    };

    /**
     * Returns the caret position and the selected node in the contentEditable element.
     * 
     * @param {HTMLElement} editableDiv 
     * 
     * @returns {object} res
     * @returns {integer} res.caretPos
     * @returns {HTMLTextElement} res.selectedNode
     */
    getCaretPositionAndSelectedNode(editableDiv) {
        var caretPos = 0, sel, range;

        if (window.getSelection) {
            sel = window.getSelection();

            if (sel.rangeCount) {
                range = sel.getRangeAt(0);

                if (range.commonAncestorContainer.parentNode == editableDiv) {
                    caretPos = range.endOffset;
                }
            }
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();

            if (range.parentElement() == editableDiv) {
                var tempEl = document.createElement("span");
                editableDiv.insertBefore(tempEl, editableDiv.firstChild);

                var tempRange = range.duplicate();
                tempRange.moveToElementText(tempEl);
                tempRange.setEndPoint("EndToEnd", range);

                caretPos = tempRange.text.length;
            }
        }

        return {
            caretPos: caretPos,
            selectedNode: range.endContainer
        };
    }

    /**
     * Focuses on the starting position of the provided textNode.
     * 
     * @param textNode - text node element
     * 
     * @returns null
     */
    focusAfterInsertingUserMention(textNode) {
        var range = document.createRange()

        range.setStart(textNode, 0)
        range.setEnd(textNode, 0)

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    /**
     * Returns the exact caret position inside an editable div 
     * from top point in terms of left and right.
     * 
     * @returns {object} res
     * @returns {integer} res.left - left position co-ordinate.
     * @returns {integer} res.top - top position co-ordinate.
     */
    getUserMentionToolbarPosition() {
        const sel = document.getSelection();
        const r = sel.getRangeAt(0);

        let rect;
        let r2;

        const node = r.startContainer;
        const offset = r.startOffset;

        if (offset > 0) {
            r2 = document.createRange();
            r2.setStart(node, (offset - 1));
            r2.setEnd(node, offset);

            rect = r2.getBoundingClientRect();

            return { left: rect.right, top: rect.top };
        } else if (offset < node.length) {
            r2 = document.createRange();

            r2.setStart(node, offset);
            r2.setEnd(node, (offset + 1));
            rect = r2.getBoundingClientRect();

            return { left: rect.left, top: rect.top };
        } else {
            rect = node.getBoundingClientRect();

            const styles = getComputedStyle(node);
            const lineHeight = parseInt(styles.lineHeight);
            const fontSize = parseInt(styles.fontSize);

            const delta = (lineHeight - fontSize) / 2;

            return { left: rect.left, top: (rect.top + delta) };
        }
    }

    /**
     * Creates and returns cache JSON object of user list item 
     * 
     * @param {Array} users 
     * @paramm {string} baseUrl
     * 
     * @returns {object} usersCache
     */
    cacheAllUsersAsUserListItems(users, baseUrl, accessKey) {
        /**
         * Initialise users cache.
         */
        const usersCache = {};

        /**
         * Main class object to be used inside for Each loop.
         */
        const classObj = this;

        /**
         * Cache all users by taking id as key.
         */
        users.forEach(function (user) {
            usersCache[user.id] = classObj.createUserListItem({
                userId: user.id,
                userFullName: user.name,
                userAvatar: user?.avatar,
                userSlug: user.slug,
                baseUrl: baseUrl,
                accessKey
            });
        });

        /**
         * Returns a cache JSON object of all users.
         */
        return usersCache;
    }

    /**
     * Creates and returns an array of all user list items.
     * 
     * @param {Array} users 
     * @paramm {string} baseUrl
     * 
     * @returns {Array} userListItems - all user list item components.
     * @returns {HTMLElement} serListItems[i] - user list item component.
     */
    createAllUserListItems(users, baseUrl, accessKey) {
        /**
         * Stores all user list items.
         */
        const allUserListItems = [];

        /**
         * Main class object to be used inside for Each loop.
         */
        const classObj = this;

        /**
         * Appends all user list item components in the provided order
         * for initial rnder and when no search query is provided.
         */
        users.forEach(function (user) {
            const userListItem = classObj.createUserListItem({
                userId: user.id,
                userFullName: user.name,
                userAvatar: user?.avatar,
                userSlug: user.slug,
                baseUrl: baseUrl,
                accessKey
            });

            allUserListItems.push(userListItem);
        });

        console.log("allUserListItems", allUserListItems)

        /**
         * Returns all user list items.
         */
        return allUserListItems;
    }

    /**
     * Creates and returns user mention toolbar.
     * 
     * @param {HTMLElement} searchBar
     * @param {HTMLElement} usersList
     * 
     * @returns {HTMLElement} user mention toolbar component.
     */
    createUserMentionToolbar(searchBar, usersList) {
        /**
         * Creates user mention toolbar and appends the search bar and the users list component.
         */
        const userMentionToolbar = create('div', [this.CSS.userMentionToolbar], {}, [
            searchBar,
            usersList
        ]);

        /**
         * Hide it by default.
         */
        userMentionToolbar.style.display = 'none';

        /**
         * returns user mention toolbar
         */
        return userMentionToolbar;
    }

    /**
     * Displays the user mention toolbar.
     */
    showUserMentionToolbar() {
        const caretPos = this.getUserMentionToolbarPosition();

        /**
         * Shows the hidden user mention toolbar.
         */
        this.nodes.userMentionToolbar.style.display = 'block';

        /**
         * Moves the user mention toolbar to the appropriate position of '@'.
         */
        this.nodes.userMentionToolbar.style.position = 'fixed';
        this.nodes.userMentionToolbar.style.left = (caretPos.left - 16) + 'px';
        this.nodes.userMentionToolbar.style.top = (caretPos.top - 4) + 'px';

        /**
         * Focus inside the search bar textbox
         */
        this.nodes.searchBar.children[1].focus();
    }

    /**
     * Hides the displayed user mention toolbar.
     */
    hideUserMentionToolbar() {
        /**
         * Shows the hidden user mention toolbar.
         */
        this.nodes.userMentionToolbar.style.display = 'none';

        /**
         * Empties the search bar text value.
         */
        this.nodes.searchBar.children[1].value = '';
    }

    /**
     * Hides the user mention toolbar and changes the focus to previously focused input.
     * 
     * @param {string} mainWrapper - editor holder property.
     */
    hideUserMentionToolbarAndChangeFocus(holder, accessKey) {
        /**
         * Main class object.
         */
        const classObj = this;

        /**
         * Event listner to listen to changes in the current content editable.
         * if '@' is inserted, then shows the user mention toolbar.
         * 
         * @param {event} e 
         */
        const eventListner = function (e) {
            /**
             * Updates caret position and selected node on every key up.
             */
            classObj.prevCaretPosAndSelectedNode = classObj.getCaretPositionAndSelectedNode(classObj.prevActiveElement);

            /**
             * Shows the user mention toolbar on inputting '@'.
             */
            if (e.key == accessKey) {
                classObj.showUserMentionToolbar();
            }
        };

        /**
         * Event listner to listen for focus event on editor.
         */
        document.getElementById(holder).addEventListener('focusin', function () {
            /**
             * Checks if the focused element is not user mention toolbar.
             */
            if (classObj.nodes.userMentionToolbar != document.activeElement && !classObj.nodes.userMentionToolbar.contains(document.activeElement)) {
                /**
                 * Hides the user mention toolbar if it is being displayed.
                 */
                if (classObj.nodes.userMentionToolbar.style.display != 'none') {
                    classObj.hideUserMentionToolbar();

                    /**
                     * Focuses on the previous element after hiding.
                     */
                    if (classObj.prevActiveElement && classObj.prevActiveElement != null) {
                        classObj.prevActiveElement.focus();
                    }
                } else {
                    /**
                     * Updates previous active element and add the above event listner to it.
                     */
                    classObj.prevActiveElement = document.activeElement;
                    classObj.prevActiveElement.addEventListener('keyup', eventListner);
                }
            }
        });
    }

    /**
     * Creates and returns the user list compoennt which contains all the user list item components.
     * 
     * @param {Array} userListItems
     * 
     * @returns {HTMLElement} user list wrapper.
     */
    createUsersList(userListItems) {
        /**
         * Creates a wrapper to hold all user list items.
         */
        const usersListWrapper = create('div', [this.CSS.usersListWrapper], {}, userListItems);

        /**
         * border-bottom of last user list item is removed.
         * Because ther eis already a border of users list wrapper.
         */
        if (usersListWrapper.childNodes.length > 0) {
            usersListWrapper.lastChild.style.borderBottom = 0;
        }

        /**
         * Returns users list component.
         */
        return usersListWrapper;
    }

    /**
     * Creates and returns search bar component.
     * 
     * @returns {HTMLElement} search bar.
     */
    createSearchbar(accessKey, allUsers) {
        /**
         * Creates search icon.
         */
        const searchIcon = create('div', [this.CSS.searchIcon], {}, [
            document.createTextNode(accessKey)
        ]);

        /**
         * Creates search textbox.
         */
        const searchTextbox = create('input', [this.CSS.searchTextbox], {
            type: 'text',
            placeholder: 'User'
        });

        /**
         * Main class object
         */
        const classObj = this;
        
        /**
         * Event lister that fetches users based on the inputted query.
         */
        async function searchQueryListner() {
            if(classObj.searchAPIUrl){
                try {
                    /**
                     * Gets the inputted search query.
                     */
                    const searchQuery = this.value;
                    
                    /**
                     * Fetch response from the search API
                    */
                   const response = await fetch(classObj.searchAPIUrl + searchQuery);
   
                   /**
                    * Gets a list of all user objects based on search query from search API.
                    */
                   const usersBasedOnSearchQuery = response.json().data;
   
                   /**
                    * Creates user list items from the received user objects.
                    */
                   const userListItems = classObj.createAllUserListItems(usersBasedOnSearchQuery, '', accessKey);
                       
                   /**
                    * Removes all the current user list items.
                    */
                   classObj.nodes.usersList.innerHTML = '';

                   /**
                    * Creates a new user list from the created user list items.
                    */
                   classObj.nodes.userMentionToolbar.lastChild = classObj.createUsersList(userListItems);
   
               } catch (error) {
                   console.log(error);
               }
           }else{
               try{
                   const newUserList = allUsers.filter(c => c?.name?.toLowerCase().includes(String(searchTextbox.value).toLowerCase()) || c?.slug?.toLowerCase().includes(String(searchTextbox.value).toLowerCase()) );
                   // console.log(newUserList);
               }catch (error) {
                   console.log(error);
               }
           }
        }

        searchTextbox.addEventListener('keyup', searchQueryListner);
        searchTextbox.addEventListener('keydown', searchQueryListner);
        searchTextbox.addEventListener('keypress', searchQueryListner);

        /**
         * Creates search bar.
         */
        const searchBar = create('div', [this.CSS.searchBar], {}, [
            searchIcon,
            searchTextbox
        ]);

        /**
         * returns search bar component.
         */
        return searchBar;
    }

    /**
     * Creates and returns user list item component.
     * 
     * @param {object} param
     * 
     * @param {property} param.userProfileUrl
     * @param {property} param.userFullName
     * @param {property} param.userSlug
     * 
     * @returns {HTMLElement} user list item component.
     */
    createUserListItem({ userId, userFullName, userAvatar, userSlug, baseUrl, accessKey }) {
        /**
         * Creates user full name container.
         */
        const userFullNameContainer = create('span', [this.CSS.userFullName], {}, [
            document.createTextNode(userFullName)
        ]);

        /**
         * Creates user id container.
         */
        const userSlugContainer = create('span', [this.CSS.userSlug], {}, [
            document.createTextNode(keysEnum[accessKey]['createTextNode'](userSlug))
        ]);

        /**
         * Creates user metadata container in which user full name and user id is appended.
         */
        const userMetadataContainer = create('div', [this.CSS.userMetadataContainer], {}, [
            userFullNameContainer,
            userSlugContainer
        ]);

        /**
         * Creates user name initial to be at the center fo the profile container.
         */
        const userNameInitial = create('span', [this.CSS.userNameInitial], {}, [
            document.createTextNode(userFullName[0].toUpperCase())
        ]);

        /**
         * Creates user avatar to be at the center fo the profile container.
         */
        const userProfileAvatar = create('img', [this.CSS.imageAvatar], {
           src: userAvatar
        })

        /**
         * Creates user profile container.
         */
        const userProfileContainer = create('div', [this.CSS.userProfileContainer], {}, [
           userAvatar ? userProfileAvatar : userNameInitial
        ]);

        /**
         * Creates user list item wrapper and appends profile and metadata container.
         */
        const userListItemWrapper = create('div', [this.CSS.userListItemWrapper], {}, [
            userProfileContainer,
            userMetadataContainer
        ]);

        /**
         * Main class object
         */
        const classObj = this;

        /**
         * Selects the user and appends its name with @ as a link in the paragraph data.
         */
        userListItemWrapper.addEventListener('click', function () {
            /**
             * Creates user mention link to be added in the previous input or 
             * content editable element.
             */
            const userMentionLink = create('span', [], {
                href: baseUrl + userSlug,
                target: "_blank",
                contentEditable: false,
                class: keysEnum[accessKey]['textNodeClassName']
            }, [
                document.createTextNode(keysEnum[accessKey]['createTextNode'](userSlug))
            ]);

            /**
             * Gets caret position and selected node from which the '@' in inputted.
             */
            const { caretPos, selectedNode } = classObj.prevCaretPosAndSelectedNode;

            /**
             * Slices the textNode into 2 parts where '@' is inputted.
             */
            const firstHalf = document.createTextNode(selectedNode.textContent.slice(0, caretPos - 1));
            const secondHalf = document.createTextNode(selectedNode.textContent.slice(caretPos));

            /**
             * Inserts the link between the two halfs of the selected node.
             */
            classObj.prevActiveElement.insertBefore(firstHalf, selectedNode);
            classObj.prevActiveElement.insertBefore(userMentionLink, selectedNode);
            classObj.prevActiveElement.insertBefore(secondHalf, selectedNode);

            /**
             * Removes the original text node.
             */
            classObj.prevActiveElement.removeChild(selectedNode);

            /**
             * Hides the user mention toolbar once the user mention link is inserted.
             */
            classObj.hideUserMentionToolbar();

            /**
             * Focus on the second half's 0th index.
             */
            classObj.focusAfterInsertingUserMention(secondHalf);
        });

        /**
         * Returns the user list item.
         */
        return userListItemWrapper;
    }
}