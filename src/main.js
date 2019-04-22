/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import 'isomorphic-fetch';
import React from 'react';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import Matches from './Matches';
import Messages from './Messages';
import { Grid, Header, Card, Input } from 'semantic-ui-react';

const utils = require('../lib/utils');

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as making search requests to the discovery service.
 */
class Main extends React.Component {
  constructor(...props) {
    super(...props);
    const { 
      // query data
      data,
      numMatches,
      error,
      // query params
      searchQuery,
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      // query data
      data: data,   // data should already be formatted
      numMatches: numMatches || 0,
      loading: false,
      error: error,
      // query params
      userInput: '',
      searchQuery: searchQuery || '',
      messages: [
        { id: 0, text: 'hello', owner: 'user' },
        { id: 1, text: 'how can I help', owner: 'watson' }
      ]
    };
  }

  /**
   * fetchData - build the query that will be passed to the 
   * discovery service.
   */
  fetchData(query) {
    const { messages } = this.state;
    const searchQuery = query;

    // console.log("QUERY2 - selectedCategories: ");
    // for (let item of selectedCategories)
    //   console.log(util.inspect(item, false, null));
    // console.log("QUERY2 - searchQuery: " + searchQuery);
    
    this.setState({
      loading: true,
      searchQuery
    });

    scrollToMain();
    history.pushState({}, {}, `/${searchQuery.replace(/ /g, '+')}`);

    // build query string, with filters and optional params
    const qs = queryString.stringify({
      query: searchQuery,
      count: 4
    });

    // send request
    fetch(`/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {
        var passages = json.passages;
        passages = utils.formatData(passages);
        
        console.log('+++ DISCO RESULTS +++');
        const util = require('util');
        console.log(util.inspect(passages, false, null));
        console.log('numMatches: ' + passages.results.length);

        // add to message list
        passages.results.forEach(function(result) {
          messages.push(
            { id: messages.length,
              text: result.text,
              owner: 'watson'});
        });

        this.setState({
          data: passages,
          messages: messages,
          loading: false,
          numMatches: passages.length,
          error: null
        });
        scrollToMain();
      })
      .catch(response => {
        this.setState({
          error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching results',
          loading: false,
          data: null
        });
        // eslint-disable-next-line no-console
        console.error(response);
      });
  }
  
  /**
   * getMatches - return collection matches to be rendered.
   */
  getMatches() {
    const { data } = this.state;

    if (!data || data.results.length == 0) {
      return (
        <Header as='h3' textAlign='center'>
            No results found. Please enter new search query.
        </Header>
      );
    } else {
      return (
        <Matches 
          matches={ data.results }
        />
      );
    }
  }

  handleKeyPress(event) {
    const { messages, userInput } = this.state;

    if (event.key === 'Enter') {
      const searchValue = userInput;
      messages.push(
        { id: messages.length,
          text: searchValue,
          owner: 'user'
        }
      );

      this.setState({
        messages: messages,
        // clear out input field
        userInput: ''
      });
      console.log('searchQuery [FROM SEARCH]: ' + searchValue);
      this.fetchData(searchValue);
    } else {
      this.setState({
        // add letter to our string
        userInput: userInput.concat(event.key)
      });        
    }
  }

  getListItems() {
    const { messages } = this.state;

    return (
      <Messages
        messages={messages}
      />
    );
  }
  
  /**
   * render - return all the home page object to be rendered.
   */
  render() {

    return (
      <Grid celled className='search-grid'>

        <Grid.Row className='matches-grid-row'>
          <Grid.Column width={16}>

            <Card className='chatbot-container'>
              <Card.Content className='dialog-header'>
                <Card.Header>Document Search ChatBot</Card.Header>
              </Card.Content>
              <Card.Content>
                {this.getListItems()}
              </Card.Content>
              <Input
                icon='compose'
                value={this.state.userInput}
                placeholder='Enter response......'
                onKeyPress={this.handleKeyPress.bind(this)}
              />
            </Card>

          </Grid.Column>
        </Grid.Row>

      </Grid>
    );
  }
}

/**
 * scrollToMain - scroll window to show 'main' rendered object.
 */
function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

// type check to ensure we are called correctly
Main.propTypes = {
  data: PropTypes.object,
  searchQuery: PropTypes.string,
  numMatches: PropTypes.number,
  messages: PropTypes.array,
  error: PropTypes.object
};

module.exports = Main;
