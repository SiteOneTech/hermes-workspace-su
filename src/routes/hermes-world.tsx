import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { HermesWorldLanding } from '@/screens/playground/hermes-world-landing'
import { HermesWorldDisabled, isHermesWorldDisabled } from './-hermes-world-disabled'

export const Route = createFileRoute('/hermes-world')({
  ssr: false,
  component: HermesWorldRoute,
})

function HermesWorldRoute() {
  if (isHermesWorldDisabled()) return <HermesWorldDisabled />

  usePageTitle('HermesWorld — AI Agent RPG')
  return <HermesWorldLanding />
}
