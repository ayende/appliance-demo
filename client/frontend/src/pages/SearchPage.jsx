import QuestionList from "../components/QuestionList";
import { useQuestions } from "../hooks/useQuestions";
import BackendTiming from "../components/BackendTiming";
import RelatedTags from "../components/RelatedTags";
import SearchController from "../components/SearchController";
import QuestionPagination from "../components/QuestionPagination";
import "../styles/pages/search-page.css";

function SearchPage() {
  const { queryResult } = useQuestions();

  return (
    <main className="search-page">
      {!queryResult && <div className="search-page-loader">loading...</div>}
      {queryResult && (
        <>
          <div className="question-container">
            {/* <QuestionList queryResult={queryResult.data} /> */}
            <QuestionPagination totalPages={queryResult.data.totalResults} />
          </div>
          <div className="search-page-info-container">
            <SearchController />
            <BackendTiming serverResult={queryResult} />
            <RelatedTags tags={queryResult.data.relatedTags} />
          </div>
        </>
      )}
    </main>
  );
}

export default SearchPage;
