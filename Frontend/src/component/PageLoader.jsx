import React from 'react'
import { LoaderIcon } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'

const PageLoader = () => {
  const { theme} = useThemeStore();
  return (
    <div>
      <div className='min-h-screen items-center justify-center' data-theme={theme}>
        <LoaderIcon className="animate-spin size-10 text-primary"/>
      </div>
    </div>
  )
}

export default PageLoader
