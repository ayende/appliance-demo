import { useSearchParams } from "react-router-dom";
import "../styles/components/question-pagination.css";

/* eslint-disable react/prop-types */
function QuestionPagination({ totalPages }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const numOfPages = Math.ceil(totalPages / pageSize);
  const pages = Array.from({ length: 9 }).reduce((acc, _, i) => {
    if (i === 0 && page > 4) return [1];
    if (i === 1 && page - 4 > 1) return [...acc, "..."];
    if (i >= 2 && i <= 6 && page - 4 + i > 0 && page - 4 + i <= numOfPages) {
      acc.push(page - 4 + i);
    }
    if (i === 7 && page + 4 < numOfPages) return [...acc, "..."];
    if (i === 8 && page < numOfPages - 3) return [...acc, numOfPages];
    return acc;
  }, []);

  return (
    <div className="search-page-pagination">
      <div className="search-page-pagination-page-container">
        {pages.map((p, i) => (
          <button
            key={p + i}
            className={`search-page-pagination-page ${
              page === p - 1 ? "active" : ""
            }`}
            onClick={() => {
              setSearchParams({ page: p });
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="search-page-pagination-page-size-container"></div>
    </div>
  );
}

export default QuestionPagination;
