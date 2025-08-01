// Copyright 2025 The wharf Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useNavigate, useParams } from 'react-router-dom';
import './index.css';
import { useState } from 'react';
import { DockerContainer } from '../../models/container';
import {
  getContainer,
  renameContainer,
  containerLabelsUpdate,
} from '../../api/container';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';

const ContainerUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [container, setContainer] = useState<DockerContainer | null>(null);
  const [name, setName] = useState<string>('');
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [labelKey, setLabelKey] = useState<string>('');
  const [labelValue, setLabelValue] = useState<string>('');

  const addLabel = () => {
    if (!labelKey.trim()) {
      toast.error('Label key is required');
      return;
    }

    if (!labelValue.trim()) {
      toast.error('Label value is required');
      return;
    }

    if (labels.hasOwnProperty(labelKey)) {
      toast.error('Label key already exists');
      return;
    }

    setLabels(prev => ({
      ...prev,
      [labelKey.trim()]: labelValue.trim(),
    }));

    setLabelKey('');
    setLabelValue('');
  };

  const removeLabel = (keyToRemove: string) => {
    setLabels(prev => {
      const { [keyToRemove]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addLabel();
    }
  };

  const update = async () => {
    if (!container) {
      return;
    }
    try {
      if (
        name.trim() !== '' &&
        name !== container?.Names[0].replace(/^\//, '')
      ) {
        await renameContainer(
          localStorage.getItem('token') as string,
          container?.Id,
          name.trim()
        );
      }
      if (JSON.stringify(labels) !== JSON.stringify(container.Labels)) {
        const res = await containerLabelsUpdate(
          localStorage.getItem('token') as string,
          container?.Id,
          labels
        );
        navigate('/container/' + res.data.Id);
        return;
      }
      navigate('/container/' + id);
    } catch (e: any) {
      throw e.response ? e.response.data : { error: 'Request failed' };
    }
  };

  const handleSubmit = async () => {
    if (name.trim() === '') {
      toast.error('Container name cannot be empty.');
      return;
    }
    if (
      name === container?.Names[0].replace(/^\//, '') &&
      JSON.stringify(labels) === JSON.stringify(container?.Labels)
    ) {
      toast.error('No changes made.');
      return;
    }
    toast.promise(update(), {
      loading: 'Updating container...',
      success: 'Container updated successfully',
      error: data => `Error updating container: ${data.error}`,
    });
  };

  const fetchContainer = async () => {
    if (id === undefined || id === null) {
      return;
    }
    try {
      const res = await getContainer(
        localStorage.getItem('token') as string,
        id as string
      );
      setContainer(res.data);
      setLabels(Object.fromEntries(Object.entries(res.data.Labels)));
      setName(res.data.Names[0].replace(/^\//, ''));
    } catch (e) {
      console.log(e);
      return navigate('/container/' + id);
    }
  };

  useQuery('container' + id, fetchContainer, {
    retry: false,
  });

  if (id === undefined || id === null) {
    return <></>;
  }

  return (
    <>
      <div className="container-update">
        <div className="back-button-container">
          <button
            className="btn back-button"
            onClick={() => window.history.back()}
          >
            <i className="fa-solid fa-arrow-left"></i> Back
          </button>
        </div>
        <div>
          <div className="container-form">
            <div className="form-group">
              <h3>Name</h3>
              <input
                type="text"
                className="form-input"
                placeholder="Container Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <h3>Labels</h3>
              <div className="label-inputs">
                <input
                  type="text"
                  className="form-input"
                  value={labelKey}
                  onChange={e => setLabelKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Label key (environment)"
                />
                <input
                  type="text"
                  className="form-input"
                  value={labelValue}
                  onChange={e => setLabelValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Label value (production)"
                />
                <button type="button" className="add-btn" onClick={addLabel}>
                  Add
                </button>
              </div>

              <div className="labels-list">
                {Object.entries(labels).map(([key, value]) => (
                  <div key={key} className="label-item">
                    <span>
                      {key}: {value}
                    </span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeLabel(key)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" className="save-btn" onClick={handleSubmit}>
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContainerUpdate;
