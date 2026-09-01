import React, { FunctionComponent } from 'react'
import { splitTreeMatch } from './TreeFilter'
import { useTreeSearch } from './TreeSearchContext'

interface Props {
  text: string
}

export const TreeMatch: FunctionComponent<Props> = ({ text }) => {
  const search = useTreeSearch()

  return splitTreeMatch(text, search).map((segment, index) =>
    segment.isMatch ? (
      <mark key={`${index}:${segment.text}`}>{segment.text}</mark>
    ) : (
      segment.text
    ),
  )
}
