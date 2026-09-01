import { createContext, useContext } from 'react'

export const TreeSearchContext = createContext('')

export const useTreeSearch = (): string => useContext(TreeSearchContext)
