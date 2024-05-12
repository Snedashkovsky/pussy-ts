import { useParams } from 'react-router-dom';
import Display from 'src/components/containerGradient/Display/Display';
import DisplayTitle from 'src/components/containerGradient/DisplayTitle/DisplayTitle';
import { SubnetHyperParameters } from 'src/features/cybernet/types';
import useCybernetContract from 'src/features/cybernet/ui/useQueryCybernetContract.refactor';

import styles from '../../Subnet.module.scss';
import useAdviserTexts from 'src/features/cybernet/_move/useAdviserTexts';

const config: { [K in keyof SubnetHyperParameters]: { text: string } } = {
  rho: {
    text: 'Rho',
  },
  kappa: {
    text: 'Kappa',
  },
  immunity_period: {
    text: 'Immunity Period',
  },
  min_allowed_weights: {
    text: 'Min Allowed Weights',
  },
  max_weights_limit: {
    text: 'Max Weights Limit',
  },
  tempo: {
    text: 'Tempo',
  },
  min_difficulty: {
    text: 'Min Difficulty',
  },
  max_difficulty: {
    text: 'Max Difficulty',
  },
  weights_version: {
    text: 'Weights Version',
  },
  weights_rate_limit: {
    text: 'Weights Rate Limit',
  },
  adjustment_interval: {
    text: 'Adjustment Interval',
  },
  activity_cutoff: {
    text: 'Activity Cutoff',
  },
  registration_allowed: {
    text: 'Registration Allowed',
  },
  target_regs_per_interval: {
    text: 'Target Regs Per Interval',
  },
  min_burn: {
    text: 'Min Burn',
  },
  max_burn: {
    text: 'Max Burn',
  },
  bonds_moving_avg: {
    text: 'Bonds Moving Avg',
  },
  max_regs_per_block: {
    text: 'Max Regs Per Block',
  },
};

function SubnetHyperParams() {
  const { id: netuid } = useParams();

  const hyperparamsQuery = useCybernetContract<SubnetHyperParameters>({
    query: {
      get_subnet_hyperparams: {
        netuid: +netuid,
      },
    },
  });

  useAdviserTexts({
    isLoading: hyperparamsQuery.loading,
    error: hyperparamsQuery.error,
    // defaultText: 'Subnet hyperparams',
  });

  return (
    <Display noPaddingX title={<DisplayTitle title="Hyperparams" />}>
      <ul className={styles.list}>
        {hyperparamsQuery.data &&
          Object.keys(hyperparamsQuery.data).map((item) => {
            const value = hyperparamsQuery.data[item];
            let content = value;

            if (['min_burn', 'max_burn'].includes(item)) {
              content = <span>{value.toLocaleString()} 🟣</span>;
            }

            if (item === 'registration_allowed') {
              content = <span>{value === true ? 'yes' : 'no'}</span>;
            }

            return (
              <li key={item}>
                {config[item].text || item}: <div>{content}</div>
              </li>
            );
          })}
      </ul>
    </Display>
  );
}

export default SubnetHyperParams;
