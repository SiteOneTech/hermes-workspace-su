import { createFileRoute } from '@tanstack/react-router'
import { usePageTitle } from '@/hooks/use-page-title'
import { HermesWorldEmbed } from '@/screens/playground/hermes-world-embed'
import { HermesWorldDisabled, isHermesWorldDisabled } from './-hermes-world-disabled'

export const Route = createFileRoute('/playground')({
  ssr: false,
  component: PlaygroundRoute,
})

function PlaygroundRoute() {
  if (isHermesWorldDisabled()) return <HermesWorldDisabled />

  usePageTitle('HermesWorld')
  return <HermesWorldEmbed />
}
