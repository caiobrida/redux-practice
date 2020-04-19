import React, { useEffect } from 'react';
import { loadBugs, getUnresolvedBugs, resolveBug } from '../store/bugs';
import { useDispatch, useSelector } from 'react-redux';

function Bugs() {
  const dispatch = useDispatch();
  const bugs = useSelector(getUnresolvedBugs)

  useEffect(() => {
    dispatch(loadBugs());
  }, []);

  return (
      <ul>
        { bugs.map(bug => (
        <li 
          key={bug.id}>
            { bug.description }
        <button onClick={() => dispatch(resolveBug(bug.id))}>Resolve</button>
        </li>
        )) }
      </ul>
  );
}

export default Bugs;