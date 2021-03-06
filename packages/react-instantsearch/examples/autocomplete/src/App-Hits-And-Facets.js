import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { InstantSearch, Configure } from 'react-instantsearch/dom';
import { createConnector } from 'react-instantsearch';
import {
  connectSearchBox,
  connectRefinementList,
} from 'react-instantsearch/connectors';
import Autosuggest from 'react-autosuggest';
import { forOwn } from 'lodash';
import 'react-instantsearch-theme-algolia/style.css';

class App2 extends Component {
  render() {
    return (
      <InstantSearch
        appId="latency"
        apiKey="6be0576ff61c053d5f9a3225e2a90f76"
        indexName="bestbuy"
      >
        <div>
          <Configure hitsPerPage={3} />
          <VirtualSearchBox />
          <VirtualRefinementList attributeName="manufacturer" />
          <VirtualRefinementList attributeName="category" />
          <ConnectedAutoComplete attributes={['manufacturer', 'category']} />
        </div>
      </InstantSearch>
    );
  }
}

const VirtualSearchBox = connectSearchBox(() => null);
const VirtualRefinementList = connectRefinementList(() => null);

const connectAutoComplete = createConnector({
  displayName: 'AutoComplete',

  /*
   We retrieve all the values needed:
   - Current query
   - Hits
   - Facet values (given an array of attributes provided to the component)
   To work properly, you need to use Virtual Widgets for the SearchBox and all the
   facets you want the value of.
   */
  getProvidedProps(props, state, search) {
    const hits = search.results && search.results.bestbuy
      ? search.results.bestbuy.hits
      : [];
    const facets = props.attributes.reduce((acc, attributeName) => {
      if (search.results && search.results.bestbuy) {
        acc[attributeName] = search.results.bestbuy
          .getFacetValues(attributeName)
          .slice(0, 3)
          .map(v => ({
            name: v.name,
          }));
      }
      return acc;
    }, {});
    return {
      hits,
      query: state.query !== undefined ? state.query : '',
      facets,
    };
  },

  // we update the state of <InstantSearch/> to trigger a new search.
  refine(props, searchState, nextQuery) {
    return {
      ...searchState,
      query: nextQuery,
    };
  },
});

class AutoComplete extends Component {
  formatHitsForAutoSuggest(props) {
    const hits = [];
    forOwn({ ...props.facets, hits: props.hits }, (value, key) => {
      hits.push({ title: key, hits: value });
    });
    return hits;
  }

  render() {
    return (
      <Autosuggest
        suggestions={this.formatHitsForAutoSuggest(this.props)}
        multiSection={true}
        onSuggestionsFetchRequested={({ value }) => this.props.refine(value)}
        onSuggestionsClearRequested={() => this.props.refine('')}
        getSuggestionValue={hit => hit.name}
        renderSuggestion={hit => (
          <div>
            <div>{hit.name}</div>
          </div>
        )}
        inputProps={{
          placeholder: 'Type a product',
          value: this.props.query,
          onChange: () => {},
        }}
        renderSectionTitle={section => section.title}
        getSectionSuggestions={section => section.hits}
      />
    );
  }
}

AutoComplete.propTypes = {
  refine: PropTypes.func.isRequired,
  query: PropTypes.string.isRequired,
};

const ConnectedAutoComplete = connectAutoComplete(AutoComplete);

export default App2;
